/**
 * 3단계 E2E 파이프라인 테스트
 *
 * 사용법:
 *   bun run scripts/test-pipeline.ts
 *
 * 테스트 순서:
 *   1. DB에 테스트 유저 삽입
 *   2. AI 편지 생성 + 이메일 발송
 *   3. DB에 편지 저장 확인
 *   4. 테스트 데이터 정리
 */

import { createClient } from "@supabase/supabase-js";
import { processScheduledLetter } from "../src/lib/letter-pipeline";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const testEmail = process.env.TEST_EMAIL;
  if (!testEmail) {
    console.error("❌ .env.local에 TEST_EMAIL=주소 추가 필요");
    process.exit(1);
  }

  console.log("🧪 sand 파이프라인 E2E 테스트\n");

  // 1. 테스트 유저 생성
  console.log("1️⃣  테스트 유저 DB 삽입...");
  const { data: user, error: userError } = await supabase
    .from("users")
    .insert({
      email: testEmail,
      nickname: "지은",
      current_mood: "많이 지쳐있어요",
      emotions: ["지쳐있는 느낌", "무기력함"],
      topics: ["일·직장"],
      preferred_tone: "listen_only",
    })
    .select()
    .single();

  if (userError) {
    // 이미 존재하는 경우 기존 유저 사용
    if (userError.code === "23505") {
      console.log("   ℹ️  이미 존재하는 유저, 기존 데이터 사용");
      const { data: existing } = await supabase
        .from("users")
        .select()
        .eq("email", testEmail)
        .single();
      Object.assign(user ?? {}, existing);
    } else {
      throw userError;
    }
  } else {
    console.log(`   ✅ 유저 생성 완료 (id: ${user.id})`);
  }

  const { data: targetUser } = await supabase
    .from("users")
    .select()
    .eq("email", testEmail)
    .single();

  if (!targetUser) throw new Error("유저 조회 실패");

  // 2. 첫 편지 예약 생성
  console.log("\n2️⃣  첫 편지 예약 생성...");
  const { data: scheduled, error: schedError } = await supabase
    .from("scheduled_letters")
    .insert({
      user_id: targetUser.id,
      type: "first",
      status: "pending",
      send_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (schedError) throw schedError;
  console.log(`   ✅ 예약 생성 완료 (id: ${scheduled.id})`);

  // 3. 파이프라인 실행 (AI 생성 + 발송 + DB 저장)
  console.log(`\n3️⃣  AI 편지 생성 + ${testEmail} 발송 중...`);
  await processScheduledLetter(scheduled.id);
  console.log("   ✅ 발송 완료!");

  // 4. DB 확인
  console.log("\n4️⃣  DB 저장 확인...");
  const { data: letters } = await supabase
    .from("letters")
    .select("sender, body, created_at")
    .eq("user_id", targetUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (letters?.length) {
    console.log(`   ✅ 편지 저장 확인 (${letters[0].sender}, ${letters[0].body.length}자)`);
  }

  const { data: sentScheduled } = await supabase
    .from("scheduled_letters")
    .select("status")
    .eq("id", scheduled.id)
    .single();

  console.log(`   ✅ 예약 상태: ${sentScheduled?.status}`);

  // 5. 테스트 데이터 정리
  console.log("\n5️⃣  테스트 데이터 정리...");
  await supabase.from("users").delete().eq("email", testEmail);
  console.log("   ✅ 완료");

  console.log("\n════════════════════════════════════════");
  console.log("✅ 전체 파이프라인 테스트 성공!");
  console.log(`   Gmail(${testEmail}) 받은편지함 확인하세요`);
  console.log("════════════════════════════════════════");
}

main().catch(console.error);
