/**
 * Cron: 예약된 편지 발송
 * GET /api/cron/send-letters
 *
 * Vercel Hobby: 매일 오전 9시 실행
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { processScheduledLetter } from "@/lib/letter-pipeline";

export async function GET(req: NextRequest) {
  // Vercel Cron 인증
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 발송 대기 중인 편지 조회
  const { data: pending } = await supabase
    .from("scheduled_letters")
    .select("id")
    .eq("status", "pending")
    .lte("send_at", new Date().toISOString())
    .lt("retry_count", 3)
    .limit(50);

  if (!pending?.length) {
    return NextResponse.json({ processed: 0 });
  }

  const results = await Promise.allSettled(
    pending.map((s) => processScheduledLetter(s.id))
  );

  // 실패한 것들 retry_count 증가
  const failed = results
    .map((r, i) => ({ result: r, id: pending[i].id }))
    .filter(({ result }) => result.status === "rejected");

  for (const { id } of failed) {
    await supabase.rpc("increment_retry", { letter_id: id });
  }

  return NextResponse.json({
    processed: results.length,
    succeeded: results.filter((r) => r.status === "fulfilled").length,
    failed: failed.length,
  });
}
