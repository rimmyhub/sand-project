-- sand DB 스키마
-- Supabase SQL Editor에서 실행하세요

-- ─── Users ────────────────────────────────────────────────────────────────────

create table if not exists users (
  id                  uuid primary key default gen_random_uuid(),
  email               text not null unique,
  nickname            text,                          -- null이면 "당신"으로 표시
  current_mood        text,                          -- Q0
  emotions            text[] not null default '{}',  -- Q1
  topics              text[] not null default '{}',  -- Q2
  preferred_tone      text not null default 'unknown', -- Q3: listen_only | advice_ok | unknown
  is_active           boolean not null default true,
  unsubscribe_token   text not null default encode(gen_random_bytes(24), 'hex'),
  emotion_summary     text,                          -- AI가 매 편지마다 업데이트
  created_at          timestamptz not null default now(),
  last_letter_at      timestamptz                    -- 마지막 편지 발송 시각
);

-- ─── Letters ──────────────────────────────────────────────────────────────────

create table if not exists letters (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  sender      text not null check (sender in ('ai', 'user')),
  body        text not null,     -- 편지 본문 (평문 저장, 필요 시 암호화 추가)
  message_id  text,              -- 이메일 Message-ID (스레딩용)
  created_at  timestamptz not null default now()
);

create index if not exists letters_user_id_created_at on letters(user_id, created_at desc);

-- ─── Scheduled Letters ────────────────────────────────────────────────────────

create table if not exists scheduled_letters (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  type         text not null default 'reply' check (type in ('welcome', 'first', 'reply', 'nudge_3d', 'nudge_7d', 'check_14d')),
  send_at      timestamptz not null,
  retry_count  int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists scheduled_letters_pending on scheduled_letters(status, send_at)
  where status = 'pending';

-- ─── Functions ────────────────────────────────────────────────────────────────

-- retry_count 증가 + 3회 이상이면 failed 처리
create or replace function increment_retry(letter_id uuid)
returns void language plpgsql as $$
begin
  update scheduled_letters
  set
    retry_count = retry_count + 1,
    status = case when retry_count + 1 >= 3 then 'failed' else status end
  where id = letter_id;
end;
$$;
