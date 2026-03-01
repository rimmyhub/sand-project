# sand

하루 한 통, 당신의 이야기를 듣고 싶은 AI 편지 친구.

## 스택

- **Frontend**: Next.js 16 + Tailwind CSS
- **AI**: Gemini 2.5 Flash
- **DB**: Supabase (PostgreSQL)
- **이메일 발송**: Resend
- **이메일 수신**: Postmark Inbound
- **배포**: Vercel

## 로컬 실행

```bash
# 의존성 설치
bun install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local에 실제 키 입력

# 개발 서버 실행
bun dev
```

## 환경변수

`.env.local.example` 참고

## 테스트 스크립트

```bash
# AI 편지 품질 테스트
bun run test:letter

# 이메일 발송 테스트
bun run test:email

# 전체 파이프라인 E2E 테스트
bun run test:pipeline
```

## 주요 경로

| 경로 | 설명 |
|------|------|
| `/` | 랜딩 페이지 |
| `/onboarding` | 온보딩 설문 |
| `/welcome` | 구독 완료 |
| `/api/subscribe` | 구독 처리 |
| `/api/mail/inbound` | Postmark 웹훅 |
| `/api/cron/send-letters` | 편지 발송 Cron |
