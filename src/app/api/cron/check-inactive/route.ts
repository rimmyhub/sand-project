/**
 * Cron: 장기 미응답 사용자 체크인 편지 예약
 * GET /api/cron/check-inactive
 *
 * 매일 실행 — 마지막 AI 편지 이후 답장이 없는 사용자에게 체크인 편지를 예약
 *   3일 미응답 → nudge_3d
 *   7일 미응답 → nudge_7d
 *  14일 미응답 → check_14d (이후 더 이상 보내지 않음)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

interface NudgeRule {
  type: "nudge_3d" | "nudge_7d" | "check_14d";
  daysInactive: number;
}

const NUDGE_RULES: NudgeRule[] = [
  { type: "check_14d", daysInactive: 14 },
  { type: "nudge_7d", daysInactive: 7 },
  { type: "nudge_3d", daysInactive: 3 },
];

export async function GET(req: NextRequest) {
  // Vercel Cron 인증
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let totalCreated = 0;

  for (const rule of NUDGE_RULES) {
    const cutoff = new Date(Date.now() - rule.daysInactive * 24 * 60 * 60 * 1000).toISOString();

    // 조건: 활성 사용자 + 마지막 편지가 N일 이상 전
    const { data: candidates, error: queryError } = await supabase
      .from("users")
      .select("id")
      .eq("is_active", true)
      .lte("last_letter_at", cutoff)
      .limit(100);

    if (queryError) {
      logger.error("cron.inactive.query_failed", { type: rule.type, error: queryError.message });
      continue;
    }

    if (!candidates?.length) continue;

    for (const user of candidates) {
      // 이미 같은 타입의 체크인이 예약/발송되었는지 확인 (중복 방지)
      const { count } = await supabase
        .from("scheduled_letters")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("type", rule.type);

      if (count && count > 0) continue;

      // 더 높은 단계의 체크인이 이미 있으면 낮은 단계는 건너뛰기
      if (rule.type === "nudge_3d") {
        const { count: higherCount } = await supabase
          .from("scheduled_letters")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .in("type", ["nudge_7d", "check_14d"]);
        if (higherCount && higherCount > 0) continue;
      }
      if (rule.type === "nudge_7d") {
        const { count: higherCount } = await supabase
          .from("scheduled_letters")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("type", "check_14d");
        if (higherCount && higherCount > 0) continue;
      }

      // 현재 pending인 편지가 있으면 건너뛰기 (답장 대기 중)
      const { count: pendingCount } = await supabase
        .from("scheduled_letters")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "pending");

      if (pendingCount && pendingCount > 0) continue;

      // 체크인 편지 예약
      const { error: insertError } = await supabase.from("scheduled_letters").insert({
        user_id: user.id,
        type: rule.type,
        status: "pending",
        send_at: new Date().toISOString(),
      });

      if (insertError) {
        logger.error("cron.inactive.insert_failed", { userId: user.id, type: rule.type, error: insertError.message });
        continue;
      }

      logger.info("cron.inactive.scheduled", { userId: user.id, type: rule.type });
      totalCreated++;
    }
  }

  logger.info("cron.inactive.completed", { created: totalCreated });
  return NextResponse.json({ created: totalCreated });
}
