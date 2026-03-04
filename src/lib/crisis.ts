/**
 * 위기 키워드 감지 + 안내 이메일 발송
 */

import { Resend } from "resend";
import { logger } from "./logger";

const CRISIS_KEYWORDS = [
  "자해", "자살", "죽고싶다", "죽고 싶다", "사라지고싶다", "사라지고 싶다",
  "끝내고싶다", "끝내고 싶다", "살기싫다", "살기 싫다", "죽어버리고싶다",
];

export function detectCrisis(text: string): boolean {
  return CRISIS_KEYWORDS.some((kw) => text.includes(kw));
}

export async function sendCrisisEmail(to: string, nickname: string | null) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const name = nickname || "당신";

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject: "괜찮아요 — sand",
    text: `${name}에게,

지금 많이 힘드신 것 같아요. 혼자 있지 않아도 괜찮아요.

지금 이 순간이 너무 힘드시다면, 아래에 24시간 연결되는 곳이 있어요.

자살예방상담전화: 1393 (24시간)
정신건강 위기상담전화: 1577-0199 (24시간)
생명의전화: 1588-9191 (24시간)

당신의 이야기를 듣고 싶어요.
— sand`,
  });

  if (error) {
    logger.error("crisis.email_failed", { to, error: JSON.stringify(error) });
    throw new Error(`Crisis email failed: ${to}`);
  }

  logger.info("crisis.email_sent", { to });
}
