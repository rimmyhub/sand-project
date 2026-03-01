import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── 타입 ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  nickname: string | null;
  current_mood: string | null;
  emotions: string[];
  topics: string[];
  preferred_tone: "listen_only" | "advice_ok" | "unknown";
  is_active: boolean;
  unsubscribe_token: string;
  emotion_summary: string | null;
  created_at: string;
  last_letter_at: string | null;
}

export interface Letter {
  id: string;
  user_id: string;
  sender: "ai" | "user";
  body: string;
  message_id: string | null;
  created_at: string;
}

export interface ScheduledLetter {
  id: string;
  user_id: string;
  status: "pending" | "sent" | "failed";
  type: "welcome" | "first" | "reply" | "nudge_3d" | "nudge_7d" | "check_14d";
  send_at: string;
  retry_count: number;
  created_at: string;
}
