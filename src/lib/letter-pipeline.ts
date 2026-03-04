/**
 * AI 편지 생성 + Resend 발송 파이프라인
 */

import { Resend } from "resend";
import { GoogleGenAI } from "@google/genai";
import { supabase, type User } from "./supabase";
import { buildSystemPrompt, type LetterType } from "./prompts/letter";
import { logger } from "./logger";

const resend = new Resend(process.env.RESEND_API_KEY!);

/** HTML 특수문자 이스케이핑 (XSS 방지) */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─── AI 편지 생성 ──────────────────────────────────────────────────────────────

async function generateLetter(user: User, isFirstLetter: boolean, letterType?: LetterType): Promise<string> {
  // 최근 편지 5통 로드
  const { data: recentLetters, error: lettersError } = await supabase
    .from("letters")
    .select("sender, body")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (lettersError) {
    logger.warn("letter.history_load_failed", { userId: user.id, error: lettersError.message });
  }

  const isNudge = letterType === "nudge_3d" || letterType === "nudge_7d" || letterType === "check_14d";

  const ctx = {
    isFirstLetter,
    letterType,
    onboarding: {
      nickname: user.nickname ?? "",
      currentMood: user.current_mood ?? undefined,
      emotions: user.emotions,
      topics: user.topics,
      preferredTone: user.preferred_tone,
    },
    emotionSummary: user.emotion_summary ?? undefined,
    recentLetters: (recentLetters ?? []).reverse() as Array<{
      sender: "ai" | "user";
      body: string;
    }>,
  };

  const contentPrompt = isNudge
    ? "사용자에게 보내는 체크인 편지를 작성해주세요. 답장을 재촉하지 말고, 자연스럽게 안부를 물어주세요."
    : isFirstLetter
      ? "첫 편지를 작성해주세요."
      : "마지막 사용자 편지에 대한 답장을 작성해주세요.";

  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contentPrompt,
    config: {
      systemInstruction: buildSystemPrompt(ctx),
      maxOutputTokens: 4096,
      temperature: 0.9,
    },
  });

  const text = response.text ?? "";
  if (!text) {
    throw new Error("AI returned empty response");
  }

  logger.info("letter.generated", { userId: user.id, letterType, length: text.length });
  return text;
}

// ─── 이메일 발송 ────────────────────────────────────────────────────────────────

async function sendLetter(
  user: User,
  letterBody: string,
  inReplyTo: string | null,
  isFirstLetter: boolean,
  letterType?: LetterType
): Promise<string> {
  const isNudge = letterType === "nudge_3d" || letterType === "nudge_7d" || letterType === "check_14d";
  const subject = isFirstLetter
    ? "안녕하세요 — 저는 sand예요"
    : isNudge
      ? "잘 지내고 있나요 — sand"
      : "sand로부터 답장이 도착했어요";

  const cleanedBody = letterBody.replace(/[-—–]\s*sand\s*$/i, "").trimEnd();
  const htmlBody = cleanedBody
    .split("\n")
    .map((line) => (line === "" ? "<br>" : `<p style="margin:0 0 8px">${escapeHtml(line)}</p>`))
    .join("");

  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "https://sand.so"}/unsubscribe?token=${user.unsubscribe_token}`;

  const headers: Record<string, string> = {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };

  if (inReplyTo) {
    headers["In-Reply-To"] = inReplyTo;
    headers["References"] = inReplyTo;
  }

  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    replyTo: process.env.REPLY_TO_EMAIL!,
    to: user.email,
    subject,
    html: `
      <div style="max-width:520px;margin:0 auto;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#333;padding:40px 24px">
        <img src="${process.env.NEXT_PUBLIC_BASE_URL ?? "https://fromsand.shop"}/sand-logo.png" alt="sand" width="90" height="45" style="margin-bottom:32px;margin-left:-8px;display:block">
        ${htmlBody}
        <p style="margin-top:32px;font-size:12px;color:#ccc;text-align:right">
          <a href="${unsubscribeUrl}" style="color:#ccc">구독 해지</a>
        </p>
      </div>
    `,
    text: letterBody,
    headers,
  });

  if (error) {
    logger.error("letter.send_failed", { userId: user.id, email: user.email, error: JSON.stringify(error) });
    throw new Error(`Email send failed: ${JSON.stringify(error)}`);
  }

  logger.info("letter.sent", { userId: user.id, emailId: data?.id, letterType });
  return data?.id ?? "";
}

// ─── 메인 파이프라인 ───────────────────────────────────────────────────────────

export async function processScheduledLetter(scheduledId: string): Promise<void> {
  // 예약 레코드 조회
  const { data: scheduled, error: scheduledError } = await supabase
    .from("scheduled_letters")
    .select("*")
    .eq("id", scheduledId)
    .single();

  if (scheduledError || !scheduled) {
    logger.error("pipeline.scheduled_not_found", { scheduledId, error: scheduledError?.message });
    throw new Error(`Scheduled letter not found: ${scheduledId}`);
  }

  // 사용자 조회
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", scheduled.user_id)
    .single();

  if (userError) {
    logger.error("pipeline.user_load_failed", { scheduledId, userId: scheduled.user_id, error: userError.message });
    throw new Error(`User load failed: ${scheduled.user_id}`);
  }

  if (!user || !user.is_active) {
    logger.info("pipeline.skipped_inactive", { scheduledId, userId: scheduled.user_id });
    await supabase
      .from("scheduled_letters")
      .update({ status: "failed" })
      .eq("id", scheduledId);
    return;
  }

  const isFirstLetter = scheduled.type === "first";
  const letterType = scheduled.type as LetterType;

  // 마지막 AI 편지의 message_id (스레딩용)
  const { data: lastAiLetter } = await supabase
    .from("letters")
    .select("message_id")
    .eq("user_id", user.id)
    .eq("sender", "ai")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // AI 편지 생성
  const letterBody = await generateLetter(user, isFirstLetter, letterType);

  // 이메일 발송
  const emailId = await sendLetter(user, letterBody, lastAiLetter?.message_id ?? null, isFirstLetter, letterType);

  // 편지 저장
  const { error: insertError } = await supabase.from("letters").insert({
    user_id: user.id,
    sender: "ai",
    body: letterBody,
    message_id: emailId,
  });

  if (insertError) {
    logger.error("pipeline.letter_save_failed", { scheduledId, userId: user.id, error: insertError.message });
  }

  // 예약 상태 업데이트
  const { error: updateError } = await supabase
    .from("scheduled_letters")
    .update({ status: "sent" })
    .eq("id", scheduledId);

  if (updateError) {
    logger.error("pipeline.status_update_failed", { scheduledId, error: updateError.message });
  }

  // 마지막 발송 시각 업데이트
  const { error: userUpdateError } = await supabase
    .from("users")
    .update({ last_letter_at: new Date().toISOString() })
    .eq("id", user.id);

  if (userUpdateError) {
    logger.error("pipeline.last_letter_at_failed", { userId: user.id, error: userUpdateError.message });
  }

  logger.info("pipeline.completed", { scheduledId, userId: user.id, letterType, emailId });
}
