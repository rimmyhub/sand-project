"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function UnsubscribeContent() {
  const params = useSearchParams();
  const status = params.get("status");

  const messages = {
    done: {
      title: "구독이 해지되었어요.",
      body: "더 이상 편지를 보내지 않을게요.\n언제든 다시 오고 싶으면, 그때 올 수 있어요.",
    },
    already: {
      title: "이미 해지된 구독이에요.",
      body: "편지가 계속 온다면 잠시 기다려주세요.\n예약된 편지가 있을 수 있어요.",
    },
    invalid: {
      title: "유효하지 않은 링크예요.",
      body: "링크가 올바른지 확인해주세요.",
    },
  };

  const msg = messages[(status as keyof typeof messages)] ?? messages.invalid;

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-6 py-20">
      <main className="w-full max-w-lg flex flex-col gap-8 text-center">

        <div className="flex flex-col gap-4">
          <Image src="/sand-logo.png" alt="sand" width={90} height={34} style={{ margin: '0 auto' }} />
          <h1
            className="text-2xl leading-snug text-stone-800"
            style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}
          >
            {msg.title}
          </h1>
          <p className="text-stone-500 leading-relaxed text-sm whitespace-pre-line">
            {msg.body}
          </p>
        </div>

        <Link
          href="/"
          className="w-full py-3 rounded-xl border border-stone-200 text-stone-600 text-sm hover:border-stone-400 transition-colors"
        >
          홈으로
        </Link>

      </main>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense>
      <UnsubscribeContent />
    </Suspense>
  );
}
