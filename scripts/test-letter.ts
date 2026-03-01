/**
 * 1단계: AI 편지 품질 검증 스크립트
 *
 * 사용법:
 *   # Gemini (무료 tier)
 *   GEMINI_API_KEY=AIza... bun run scripts/test-letter.ts
 *
 *   # Claude (유료)
 *   ANTHROPIC_API_KEY=sk-ant-... bun run scripts/test-letter.ts
 *
 *   # 특정 시나리오만
 *   GEMINI_API_KEY=AIza... bun run scripts/test-letter.ts first-letter-burnout
 */

import { buildSystemPrompt } from "../src/lib/prompts/letter";
import type { LetterContext } from "../src/lib/prompts/letter";

// ─── 샘플 시나리오들 ─────────────────────────────────────────────────────────

const scenarios: Record<string, LetterContext> = {
  "first-letter-burnout": {
    isFirstLetter: true,
    onboarding: {
      nickname: "지은",
      currentMood: "많이 지쳐있어요",
      emotions: ["지쳐있는 느낌", "무기력함"],
      topics: ["일·직장", "오늘 있었던 일"],
      preferredTone: "listen_only",
    },
  },
  "first-letter-lonely": {
    isFirstLetter: true,
    onboarding: {
      nickname: "민준",
      currentMood: "그냥 외로워요",
      emotions: ["외로움", "불안함"],
      topics: ["관계 고민", "그냥 아무 말이나"],
      preferredTone: "listen_only",
    },
  },
  "first-letter-unknown": {
    isFirstLetter: true,
    onboarding: {
      nickname: "",
      currentMood: "딱히 모르겠어요",
      emotions: ["답답함"],
      topics: ["그냥 아무 말이나"],
      preferredTone: "unknown",
    },
  },
  "reply-hard-day": {
    isFirstLetter: false,
    onboarding: {
      nickname: "지은",
      currentMood: "많이 지쳐있어요",
      emotions: ["지쳐있는 느낌", "무기력함"],
      topics: ["일·직장"],
      preferredTone: "listen_only",
    },
    emotionSummary:
      "지은님은 직장에서의 번아웃과 무기력함을 주로 이야기함. 누군가에게 말하고 싶지만 부담줄까봐 참는 성향.",
    recentLetters: [
      {
        sender: "ai",
        body: `지은님, 오늘 처음 편지를 씁니다.\n\n저는 sand예요. 요즘 많이 지쳐있다고 하셨는데, 그 말이 마음에 남았어요.\n\n오늘 밥은 제대로 드셨어요?\n\n— sand`,
      },
      {
        sender: "user",
        body: `안녕하세요 sand. 편지 고마워요.\n오늘 진짜 힘들었어요. 회사에서 또 야근하고 집에 와서 씻지도 못하고 그냥 누웠어요.\n밥은... 편의점 삼각김밥 하나 먹었어요.\n요즘 왜 이러고 사는지 모르겠어요.`,
      },
    ],
  },
};

// ─── Gemini ──────────────────────────────────────────────────────────────────

async function generateWithGemini(ctx: LetterContext): Promise<{ text: string; model: string }> {
  const { GoogleGenAI } = await import("@google/genai");
  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const systemPrompt = buildSystemPrompt(ctx);
  const userMessage = ctx.isFirstLetter
    ? "첫 편지를 작성해주세요."
    : "마지막 사용자 편지에 대한 답장을 작성해주세요.";

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: userMessage,
    config: {
      systemInstruction: systemPrompt,
      maxOutputTokens: 4096,
      temperature: 0.9,
    },
  }).catch((e: Error) => {
    if (e.message?.includes("free_tier") || e.message?.includes("RESOURCE_EXHAUSTED")) {
      throw new Error(
        "❌ Gemini free tier 접근 불가\n" +
        "   → AI Studio에서 새 키 발급: https://aistudio.google.com/apikey\n" +
        "   → 현재 키가 Google Cloud Console 키라면 free tier가 비활성화됨\n" +
        "   → 또는 ANTHROPIC_API_KEY로 Claude Haiku 사용 가능"
      );
    }
    throw e;
  });

  return {
    text: response.text ?? "",
    model: "gemini-2.5-flash (무료)",
  };
}

// ─── Claude ──────────────────────────────────────────────────────────────────

async function generateWithClaude(ctx: LetterContext): Promise<{ text: string; model: string }> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const systemPrompt = buildSystemPrompt(ctx);
  const userMessage = ctx.isFirstLetter
    ? "첫 편지를 작성해주세요."
    : "마지막 사용자 편지에 대한 답장을 작성해주세요.";

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return { text, model: "claude-haiku-4-5 (유료, 저렴)" };
}

// ─── 메인 ────────────────────────────────────────────────────────────────────

async function generateLetter(scenarioName: string, ctx: LetterContext) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`📬 시나리오: ${scenarioName}`);
  console.log("═".repeat(60));

  let result: { text: string; model: string };

  if (process.env.GEMINI_API_KEY) {
    result = await generateWithGemini(ctx);
  } else if (process.env.ANTHROPIC_API_KEY) {
    result = await generateWithClaude(ctx);
  } else {
    throw new Error("API 키가 없습니다. GEMINI_API_KEY 또는 ANTHROPIC_API_KEY를 설정하세요.");
  }

  console.log(`🤖 모델: ${result.model}`);
  console.log("\n" + result.text);
}

async function main() {
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;

  if (!hasGemini && !hasClaude) {
    console.error("❌ API 키가 없습니다.");
    console.error("");
    console.error("  Gemini (무료): GEMINI_API_KEY=AIza... bun run test:letter");
    console.error("  Claude (유료): ANTHROPIC_API_KEY=sk-ant-... bun run test:letter");
    console.error("");
    console.error("  Gemini API 키 발급: https://aistudio.google.com/apikey");
    process.exit(1);
  }

  const targetScenario = process.argv[2];
  const scenariosToRun = targetScenario
    ? { [targetScenario]: scenarios[targetScenario] }
    : scenarios;

  if (targetScenario && !scenarios[targetScenario]) {
    console.error(`❌ 알 수 없는 시나리오: ${targetScenario}`);
    console.error(`   가능: ${Object.keys(scenarios).join(", ")}`);
    process.exit(1);
  }

  console.log(`🚀 sand AI 편지 품질 테스트 (${Object.keys(scenariosToRun).length}개 시나리오)`);

  for (const [name, ctx] of Object.entries(scenariosToRun)) {
    await generateLetter(name, ctx);
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log("✅ 테스트 완료. 직접 읽어보세요.");
  console.log("   품질 OK → 2단계(이메일 파이프라인)로 진행");
  console.log("   프롬프트 수정 → src/lib/prompts/letter.ts");
  console.log("═".repeat(60));
}

main().catch(console.error);
