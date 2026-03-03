/**
 * Postmark 인바운드 웹훅
 * POST /api/mail/inbound
 *
 * 처리 순서:
 *   ⓪ 서명 검증 → 사용자 조회 → Rate Limit
 *   ① 인용구 제거
 *   ② 위기 키워드 감지 (즉시 발송)
 *   ③ 편지 DB 저장
 *   ④ 답장 예약 (scheduled_letters)
 *   ⑤ 200 반환
 */

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { supabase } from "@/lib/supabase";
import { detectCrisis, sendCrisisEmail } from "@/lib/crisis";
import { logger } from "@/lib/logger";

// ─── 서명 검증 ─────────────────────────────────────────────────────────────────

function verifyPostmarkSignature(req: NextRequest): boolean {
  const secret = process.env.POSTMARK_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn("inbound.no_webhook_secret", { message: "POSTMARK_WEBHOOK_SECRET not set — rejecting request" });
    return false;
  }

  // Postmark 인바운드는 HMAC 서명 미지원 → URL 쿼리 파라미터로 검증
  const token = req.nextUrl.searchParams.get("secret");
  if (!token) return false;

  // 타이밍 공격 방지를 위한 안전한 비교
  if (token.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

// ─── 인용구 제거 ───────────────────────────────────────────────────────────────

function stripQuotes(text: string): string {
  return text
    .split("\n")
    .filter((line) => !line.trimStart().startsWith(">"))
    .join("\n")
    .trim();
}

// ─── 핸들러 ────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // ⓪-1 서명 검증
  if (!verifyPostmarkSignature(req)) {
    logger.warn("inbound.signature_failed");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    logger.warn("inbound.invalid_json");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fromEmail = (payload.From as string | undefined)?.toLowerCase().trim();
  const rawText = (payload.TextBody as string) ?? "";
  const messageId = (payload.MessageID as string) ?? null;

  if (!fromEmail) {
    return NextResponse.json({ ok: true }); // 무시
  }

  // ⓪-2 사용자 조회
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("email", fromEmail)
    .single();

  if (userError && userError.code !== "PGRST116") {
    logger.error("inbound.user_lookup_failed", { email: fromEmail, error: userError.message });
  }

  // 미등록 또는 비활성 사용자 → 무시
  if (!user || !user.is_active) {
    logger.info("inbound.ignored", { email: fromEmail, reason: !user ? "not_found" : "inactive" });
    return NextResponse.json({ ok: true });
  }

  // ⓪-3 Rate Limit: 오늘 이미 처리된 편지가 있으면 무시
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("letters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("sender", "user")
    .gte("created_at", todayStart.toISOString());

  if ((count ?? 0) > 0) {
    logger.info("inbound.rate_limited", { userId: user.id });
    return NextResponse.json({ ok: true }); // 오늘 이미 처리됨
  }

  // ⓪-4 중복 수신 방지 (Postmark 재시도 대응)
  if (messageId) {
    const { count: dupCount } = await supabase
      .from("letters")
      .select("id", { count: "exact", head: true })
      .eq("message_id", messageId);

    if ((dupCount ?? 0) > 0) {
      logger.info("inbound.duplicate_ignored", { userId: user.id, messageId });
      return NextResponse.json({ ok: true });
    }
  }

  // ① 인용구 제거
  const body = stripQuotes(rawText);
  if (!body) {
    return NextResponse.json({ ok: true });
  }

  // ② 위기 키워드 감지 (즉시 처리)
  if (detectCrisis(body)) {
    logger.warn("inbound.crisis_detected", { userId: user.id });
    try {
      await sendCrisisEmail(user.email, user.nickname);
    } catch (err) {
      logger.error("inbound.crisis_email_failed", { userId: user.id, error: (err as Error).message });
    }
  }

  // ③ 편지 저장
  const { error: insertError } = await supabase.from("letters").insert({
    user_id: user.id,
    sender: "user",
    body,
    message_id: messageId,
  });

  if (insertError) {
    logger.error("inbound.letter_save_failed", { userId: user.id, error: insertError.message });
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // ④ 답장 예약 (44~52시간 후 랜덤 — 약 2일 간격)
  const delayHours = 44 + Math.random() * 8;
  const sendAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);

  const { error: scheduleError } = await supabase.from("scheduled_letters").insert({
    user_id: user.id,
    type: "reply",
    status: "pending",
    send_at: sendAt.toISOString(),
  });

  if (scheduleError) {
    logger.error("inbound.schedule_failed", { userId: user.id, error: scheduleError.message });
  }

  logger.info("inbound.processed", { userId: user.id, messageId });

  // ⑤ 즉시 200 반환
  return NextResponse.json({ ok: true });
}
