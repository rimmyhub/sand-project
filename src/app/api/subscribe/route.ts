/**
 * POST /api/subscribe
 * 온보딩 완료 → 유저 저장 → 첫 편지 즉시 발송 (백그라운드)
 */

import { NextRequest, NextResponse, after } from "next/server";
import { supabase } from "@/lib/supabase";
import { processScheduledLetter } from "@/lib/letter-pipeline";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const { email, currentMood, emotions, topics, preferredTone, nickname } =
    await req.json();

  if (!email || !emotions?.length || !topics?.length || !preferredTone) {
    return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
  }

  // 이메일 형식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "올바른 이메일 형식이 아닙니다" }, { status: 400 });
  }

  // 1. 유저 저장 (이미 있으면 업데이트)
  const { data: user, error: upsertError } = await supabase
    .from("users")
    .upsert(
      {
        email: email.toLowerCase().trim(),
        nickname: nickname || null,
        current_mood: currentMood || null,
        emotions,
        topics,
        preferred_tone: preferredTone,
        is_active: true,
      },
      { onConflict: "email" }
    )
    .select()
    .single();

  if (upsertError) {
    logger.error("subscribe.upsert_failed", { email, error: upsertError.message });
    return NextResponse.json({ error: "DB 오류" }, { status: 500 });
  }

  logger.info("subscribe.user_saved", { userId: user.id, email: user.email });

  // 2. 첫 AI 편지 — 중복 방지 후 즉시 백그라운드 발송
  const { count: existingFirst } = await supabase
    .from("scheduled_letters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "first");

  if ((existingFirst ?? 0) > 0) {
    logger.info("subscribe.first_letter_already_sent", { userId: user.id });
    return NextResponse.json({ ok: true });
  }

  const { data: scheduled, error: scheduleError } = await supabase
    .from("scheduled_letters")
    .insert({
      user_id: user.id,
      type: "first",
      status: "pending",
      send_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (scheduleError || !scheduled) {
    logger.error("subscribe.schedule_failed", { userId: user.id, error: scheduleError?.message });
    return NextResponse.json({ ok: true });
  }

  // 응답 반환 후 백그라운드에서 편지 생성·발송
  after(async () => {
    try {
      await processScheduledLetter(scheduled.id);
      logger.info("subscribe.first_letter_sent", { userId: user.id, scheduledId: scheduled.id });
    } catch (err) {
      logger.error("subscribe.first_letter_failed", { userId: user.id, error: (err as Error).message });
    }
  });

  return NextResponse.json({ ok: true });
}
