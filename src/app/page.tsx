"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-6 py-32">
      <main className="w-full max-w-lg flex flex-col gap-16">

        {/* 헤더 */}
        <header className="flex flex-col gap-4">
          <Image src="/sand-logo.png" alt="sand" width={90} height={34} />
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

        {/* 자주 묻는 질문 */}
        <section className="flex flex-col gap-6">
          <h2 className="text-lg text-stone-800" style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}>
            자주 묻는 질문
          </h2>
          <div className="flex flex-col gap-7">
            <div>
              <p className="text-sm font-medium text-stone-700 mb-2">편지는 언제 오나요?</p>
              <p className="text-sm text-stone-500 leading-relaxed">
                첫 편지는 가입 직후에 바로 도착해요.
                답장을 보내시면 다음 날 저녁 9시에 다시 편지가 와요.
                하루를 마무리하며 읽기 좋은 시간이에요.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700 mb-2">AI가 저를 기억하나요?</p>
              <p className="text-sm text-stone-500 leading-relaxed">
                네, sand는 여러분 각자만의 친구예요. 처음 알려주신 감정과 이야기,
                그리고 주고받은 편지 내용을 기억하고 있어요. 대화가 쌓일수록
                더 깊이 이해하는 친구가 됩니다.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700 mb-2">개인정보는 안전한가요?</p>
              <p className="text-sm text-stone-500 leading-relaxed">
                편지 내용과 개인정보는 비식별화하여 안전하게 관리하고 있어요.
                다른 누구도 여러분의 편지를 볼 수 없습니다.
                언제든 구독을 해지하면 데이터도 함께 삭제돼요.
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-stone-700 mb-2">구독 해지는 어떻게 하나요?</p>
              <p className="text-sm text-stone-500 leading-relaxed">
                매번 받는 편지 하단에 &lsquo;구독 해지&rsquo; 버튼이 있어요.
                클릭 한 번이면 바로 해지되고, 더 이상 편지가 오지 않아요.
              </p>
            </div>
          </div>
        </section>

        {/* 약관 링크 */}
        <footer className="flex justify-center gap-4 text-xs text-stone-400">
          <button onClick={() => alert("문의: gpfla5503@gmail.com")} className="hover:text-stone-600 transition-colors">문의하기</button>
          <span>·</span>
          <a href="/terms" className="hover:text-stone-600 transition-colors">이용약관</a>
          <span>·</span>
          <a href="/privacy" className="hover:text-stone-600 transition-colors">개인정보처리방침</a>
        </footer>

      </main>
    </div>
  );
}
