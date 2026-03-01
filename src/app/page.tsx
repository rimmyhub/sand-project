"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SAMPLE_LETTER = `지은님,

오늘 처음 편지를 씁니다.

저는 sand예요. 요즘 많이 지쳐있다고 하셨는데, 그 말이 마음에 남았어요.

작은 일상도 버겁게 느껴질 때가 있죠. 그냥 눕고만 싶은 날들이요.

오늘 밥은 제대로 드셨어요?

— sand`;

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.includes("@")) {
      setError("올바른 이메일 주소를 입력해주세요.");
      return;
    }
    router.push(`/onboarding?email=${encodeURIComponent(email)}`);
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-6 py-20">
      <main className="w-full max-w-lg flex flex-col gap-16">

        {/* 헤더 */}
        <header className="flex flex-col gap-4">
          <p className="text-sm tracking-widest text-stone-400 uppercase">sand</p>
          <h1 className="text-3xl leading-snug text-stone-800" style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}>
            하루 한 통,<br />
            당신의 이야기를<br />
            듣고 싶은 편지 친구예요.
          </h1>
          <p className="text-stone-500 leading-relaxed">
            AI가 편지를 씁니다. 답장하면 또 옵니다.<br />
            상담이 아니에요. 그냥 — 들어주는 거예요.
          </p>
        </header>

        {/* 편지 예시 */}
        <section className="bg-white border border-stone-100 rounded-2xl p-7 shadow-sm">
          <p className="text-xs text-stone-400 mb-4 tracking-wide">편지 예시</p>
          <pre className="text-stone-700 text-sm leading-7 whitespace-pre-wrap" style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}>
            {SAMPLE_LETTER}
          </pre>
        </section>

        {/* 구독 폼 */}
        <section className="flex flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 outline-none focus:border-stone-400 transition-colors text-sm"
              required
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-stone-800 text-white text-sm tracking-wide hover:bg-stone-700 transition-colors"
            >
              편지 받기
            </button>
          </form>
          <p className="text-xs text-stone-400 text-center leading-relaxed">
            하루 한 통 · 언제든 해지 가능 · 무료
          </p>
        </section>

      </main>
    </div>
  );
}
