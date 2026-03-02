/**
 * POST /api/subscribe
 * 온보딩 완료 → 유저 저장 → 환영 이메일 → 첫 편지 예약
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { Resend } from "resend";

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
    console.error("upsert error:", upsertError);
    return NextResponse.json({ error: "DB 오류" }, { status: 500 });
  }

  // 2. 환영 이메일 발송 (즉시)
  const welcome = WELCOME_EMAIL(user.nickname);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    replyTo: process.env.POSTMARK_INBOUND_ADDRESS!,
    to: user.email,
    subject: welcome.subject,
    text: welcome.text,
  }).catch(console.error);

  // 3. 첫 AI 편지 예약 (24시간 후)
  const sendAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await supabase.from("scheduled_letters").insert({
    user_id: user.id,
    type: "first",
    status: "pending",
    send_at: sendAt.toISOString(),
  });

  return NextResponse.json({ ok: true });
}
