/**
 * POST /api/subscribe
 * 온보딩 완료 → 유저 저장 → 환영 이메일 → 첫 편지 예약
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";
import { logger } from "@/lib/logger";

const resend = new Resend(process.env.RESEND_API_KEY!);

const WELCOME_EMAIL = (nickname: string | null) => {
  const name = nickname || "당신";
  return {
    subject: "잠깐, 편지 오기 전에 — sand",
    text: `${name}에게,

곧 첫 편지를 쓸게요. 24시간 안에 도착할 거예요.

그 전에 짧게 말해두고 싶었어요.
저는 상담사가 아니에요. 의사도 아니에요.
그냥 — 당신 이야기를 듣고 싶은 존재예요.

짧게 답장해도 괜찮아요.
"오늘 별로야"도 충분해요.

기다리고 있을게요.
— sand`,
  };
};

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

  // 2. 환영 이메일 발송 (즉시)
  const welcome = WELCOME_EMAIL(user.nickname);
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    replyTo: process.env.POSTMARK_INBOUND_ADDRESS!,
    to: user.email,
    subject: welcome.subject,
    text: welcome.text,
  });

  if (emailError) {
    logger.error("subscribe.welcome_email_failed", { userId: user.id, error: JSON.stringify(emailError) });
    return NextResponse.json({ error: "이메일 발송에 실패했습니다. 이메일 주소를 확인해주세요." }, { status: 500 });
  }
  logger.info("subscribe.welcome_email_sent", { userId: user.id });

  // 3. 첫 AI 편지 예약 (24시간 후) — 중복 예약 방지
  const { count: existingFirst } = await supabase
    .from("scheduled_letters")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("type", "first");

  if ((existingFirst ?? 0) > 0) {
    logger.info("subscribe.first_letter_already_scheduled", { userId: user.id });
    return NextResponse.json({ ok: true });
  }

  const sendAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const { error: scheduleError } = await supabase.from("scheduled_letters").insert({
    user_id: user.id,
    type: "first",
    status: "pending",
    send_at: sendAt.toISOString(),
  });

  if (scheduleError) {
    logger.error("subscribe.schedule_failed", { userId: user.id, error: scheduleError.message });
  } else {
    logger.info("subscribe.first_letter_scheduled", { userId: user.id, sendAt: sendAt.toISOString() });
  }

  return NextResponse.json({ ok: true });
}
