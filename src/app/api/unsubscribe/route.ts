/**
 * GET /api/unsubscribe?token=xxx
 * 구독 해지 처리: is_active=false + 예약 편지 취소
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/unsubscribe?status=invalid`);
  }

  // 유저 조회
  const { data: user, error: lookupError } = await supabase
    .from("users")
    .select("id, is_active")
    .eq("unsubscribe_token", token)
    .single();

  if (lookupError || !user) {
    logger.warn("unsubscribe.invalid_token", { token: token.slice(0, 8) + "..." });
    return NextResponse.redirect(`${baseUrl}/unsubscribe?status=invalid`);
  }

  if (!user.is_active) {
    return NextResponse.redirect(`${baseUrl}/unsubscribe?status=already`);
  }

  // 구독 해지
  const { error: deactivateError } = await supabase
    .from("users")
    .update({ is_active: false })
    .eq("id", user.id);

  if (deactivateError) {
    logger.error("unsubscribe.deactivate_failed", { userId: user.id, error: deactivateError.message });
    return NextResponse.redirect(`${baseUrl}/unsubscribe?status=invalid`);
  }

  // 예약된 편지 취소
  const { error: cancelError } = await supabase
    .from("scheduled_letters")
    .update({ status: "failed" })
    .eq("user_id", user.id)
    .eq("status", "pending");

  if (cancelError) {
    logger.error("unsubscribe.cancel_letters_failed", { userId: user.id, error: cancelError.message });
  }

  logger.info("unsubscribe.completed", { userId: user.id });
  return NextResponse.redirect(`${baseUrl}/unsubscribe?status=done`);
}
