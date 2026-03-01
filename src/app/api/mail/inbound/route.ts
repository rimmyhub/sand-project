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
import { createHmac } from "crypto";
import { supabase } from "@/lib/supabase";
import { detectCrisis, sendCrisisEmail } from "@/lib/crisis";

// ─── 서명 검증 ─────────────────────────────────────────────────────────────────

function verifyPostmarkSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.POSTMARK_WEBHOOK_SECRET;
  if (!secret) return true; // 개발 환경에서는 검증 생략

  const signature = req.headers.get("x-postmark-signature");
  if (!signature) return false;

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("base64");

  return signature === expected;
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
  if (!verifyPostmarkSignature(req, rawBody)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const fromEmail = (payload.From as string | undefined)?.toLowerCase().trim();
  const rawText = (payload.TextBody as string) ?? "";
  const messageId = (payload.MessageID as string) ?? null;

  if (!fromEmail) {
    return NextResponse.json({ ok: true }); // 무시
  }

  // ⓪-2 사용자 조회
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", fromEmail)
    .single();

  // 미등록 또는 비활성 사용자 → 무시
  if (!user || !user.is_active) {
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
    return NextResponse.json({ ok: true }); // 오늘 이미 처리됨
  }

  // ① 인용구 제거
  const body = stripQuotes(rawText);
  if (!body) {
    return NextResponse.json({ ok: true });
  }

  // ② 위기 키워드 감지 (즉시 처리)
  if (detectCrisis(body)) {
    await sendCrisisEmail(user.email, user.nickname).catch(console.error);
  }

  // ③ 편지 저장
  await supabase.from("letters").insert({
    user_id: user.id,
    sender: "user",
    body,
    message_id: messageId,
  });

  // ④ 답장 예약 (12~24시간 후 랜덤)
  const delayHours = 12 + Math.random() * 12;
  const sendAt = new Date(Date.now() + delayHours * 60 * 60 * 1000);

  await supabase.from("scheduled_letters").insert({
    user_id: user.id,
    type: "reply",
    status: "pending",
    send_at: sendAt.toISOString(),
  });

  // ⑤ 즉시 200 반환
  return NextResponse.json({ ok: true });
}
