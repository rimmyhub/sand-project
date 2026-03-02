/**
 * GET /api/unsubscribe?token=xxx
 * 구독 해지 처리: is_active=false + 예약 편지 취소
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/unsubscribe?status=invalid`);
  }

  // 유저 조회
  const { data: user } = await supabase
    .from("users")
    .select("id, is_active")
    .eq("unsubscribe_token", token)
    .single();

  if (!user) {
    return NextResponse.redirect(`${baseUrl}/unsubscribe?status=invalid`);
  }

  if (!user.is_active) {
    return NextResponse.redirect(`${baseUrl}/unsubscribe?status=already`);
  }

  // 구독 해지
  await supabase
    .from("users")
    .update({ is_active: false })
    .eq("id", user.id);

  // 예약된 편지 취소
  await supabase
    .from("scheduled_letters")
    .update({ status: "failed" })
    .eq("user_id", user.id)
    .eq("status", "pending");

  return NextResponse.redirect(`${baseUrl}/unsubscribe?status=done`);
}
