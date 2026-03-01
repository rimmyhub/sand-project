/**
 * 2단계: 이메일 발송 파이프라인 테스트
 *
 * 사용법:
 *   bun run scripts/test-email.ts 받을주소@yopmail.com
 *
 * 예시:
 *   bun run scripts/test-email.ts sandtest123@yopmail.com
 */

import { Resend } from "resend";
import { buildSystemPrompt } from "../src/lib/prompts/letter";
import { GoogleGenAI } from "@google/genai";

const resend = new Resend(process.env.RESEND_API_KEY!);

async function generateLetter(): Promise<string> {
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const ctx = {
    isFirstLetter: true,
    onboarding: {
      nickname: "지은",
      currentMood: "많이 지쳐있어요",
      emotions: ["지쳐있는 느낌", "무기력함"],
      topics: ["일·직장"],
      preferredTone: "listen_only" as const,
    },
  };

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "첫 편지를 작성해주세요.",
    config: {
      systemInstruction: buildSystemPrompt(ctx),
      maxOutputTokens: 4096,
      temperature: 0.9,
    },
  });

  return response.text ?? "";
}

async function sendEmail(to: string, letterText: string) {
  const from = process.env.RESEND_FROM_EMAIL!;

  // 줄바꿈을 HTML로 변환
  const htmlBody = letterText
    .split("\n")
    .map((line) => (line === "" ? "<br>" : `<p style="margin:0 0 8px">${line}</p>`))
    .join("");

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "sand로부터 첫 편지가 도착했어요",
    html: `
      <div style="max-width:520px;margin:0 auto;font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#333;padding:40px 24px">
        ${htmlBody}
      </div>
    `,
    text: letterText,
  });

  if (error) throw new Error(JSON.stringify(error));
  return data;
}

async function main() {
  const to = process.argv[2] || process.env.TEST_EMAIL;
  if (!to) {
    console.error("❌ 수신 이메일 주소를 입력하세요.");
    console.error("   예: bun run scripts/test-email.ts sandtest123@yopmail.com");
    console.error("   또는 .env.local에 TEST_EMAIL=주소 추가");
    process.exit(1);
  }

  console.log("✍️  AI 편지 생성 중...");
  const letter = await generateLetter();
  console.log("\n─── 생성된 편지 ───────────────────────────\n");
  console.log(letter);
  console.log("\n────────────────────────────────────────────");

  console.log(`\n📨 ${to} 로 발송 중...`);
  const result = await sendEmail(to, letter);
  console.log(`✅ 발송 완료! ID: ${result?.id}`);
  console.log(`\n👉 https://yopmail.com 에서 확인하세요`);
}

main().catch(console.error);
