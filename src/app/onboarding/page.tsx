"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const EMOTIONS = ["지쳐있는 느낌", "불안함", "외로움", "무기력함", "답답함"];
const TOPICS = ["오늘 있었던 일", "관계 고민", "일·직장", "가족", "그냥 아무 말이나"];

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({
    currentMood: "",     // Q0
    emotions: [] as string[],  // Q1
    topics: [] as string[],    // Q2
    preferredTone: "",   // Q3
    nickname: "",        // Q4
  });

  if (!email) {
    router.replace("/");
    return null;
  }

  function toggleArray(arr: string[], value: string) {
    return arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
  }

  async function handleSubmit() {
    setLoading(true);
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, ...answers }),
    });

    if (res.ok) {
      router.push("/welcome");
    } else {
      const data = await res.json().catch(() => null);
      const msg = data?.error || "오류가 발생했어요. 다시 시도해주세요.";
      alert(msg);
      setLoading(false);
    }
  }

  const steps = [
    // Q0
    <div key="q0" className="flex flex-col gap-6">
      <h2 className="text-xl text-stone-800 leading-snug" style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}>
        지금 이 순간,<br />기분이 어떠세요?
      </h2>
      <div className="flex flex-col gap-2">
        {["많이 지쳐있어요", "불안한 느낌이 있어요", "그냥 외로워요", "딱히 모르겠어요"].map((mood) => (
          <button
            key={mood}
            onClick={() => { setAnswers((a) => ({ ...a, currentMood: mood })); setStep(1); }}
            className={`px-5 py-3 rounded-xl text-sm text-left transition-colors border ${
              answers.currentMood === mood
                ? "border-stone-800 bg-stone-800 text-white"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
            }`}
          >
            {mood}
          </button>
        ))}
      </div>
    </div>,

    // Q1
    <div key="q1" className="flex flex-col gap-6">
      <h2 className="text-xl text-stone-800 leading-snug" style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}>
        요즘 어떤 감정이<br />가장 많으세요?
      </h2>
      <p className="text-xs text-stone-400">복수 선택 가능</p>
      <div className="flex flex-wrap gap-2">
        {EMOTIONS.map((e) => (
          <button
            key={e}
            onClick={() => setAnswers((a) => ({ ...a, emotions: toggleArray(a.emotions, e) }))}
            className={`px-4 py-2 rounded-full text-sm transition-colors border ${
              answers.emotions.includes(e)
                ? "border-stone-800 bg-stone-800 text-white"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <button
        onClick={() => setStep(2)}
        disabled={answers.emotions.length === 0}
        className="mt-2 w-full py-3 rounded-xl bg-stone-800 text-white text-sm disabled:opacity-30 transition-opacity"
      >
        다음
      </button>
    </div>,

    // Q2
    <div key="q2" className="flex flex-col gap-6">
      <h2 className="text-xl text-stone-800 leading-snug" style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}>
        sand에게 주로<br />어떤 이야기를 하고 싶으세요?
      </h2>
      <p className="text-xs text-stone-400">복수 선택 가능</p>
      <div className="flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <button
            key={t}
            onClick={() => setAnswers((a) => ({ ...a, topics: toggleArray(a.topics, t) }))}
            className={`px-4 py-2 rounded-full text-sm transition-colors border ${
              answers.topics.includes(t)
                ? "border-stone-800 bg-stone-800 text-white"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <button
        onClick={() => setStep(3)}
        disabled={answers.topics.length === 0}
        className="mt-2 w-full py-3 rounded-xl bg-stone-800 text-white text-sm disabled:opacity-30 transition-opacity"
      >
        다음
      </button>
    </div>,

    // Q3
    <div key="q3" className="flex flex-col gap-6">
      <h2 className="text-xl text-stone-800 leading-snug" style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}>
        AI 친구가<br />어떻게 대해주길 원하세요?
      </h2>
      <div className="flex flex-col gap-2">
        {[
          { value: "listen_only", label: "그냥 들어줬으면" },
          { value: "advice_ok", label: "가끔 조언도 해줬으면" },
          { value: "unknown", label: "모르겠어요" },
        ].map(({ value, label }) => (
          <button
            key={value}
            onClick={() => { setAnswers((a) => ({ ...a, preferredTone: value })); setStep(4); }}
            className={`px-5 py-3 rounded-xl text-sm text-left transition-colors border ${
              answers.preferredTone === value
                ? "border-stone-800 bg-stone-800 text-white"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>,

    // Q4
    <div key="q4" className="flex flex-col gap-6">
      <h2 className="text-xl text-stone-800 leading-snug" style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}>
        어떻게 불러드릴까요?
      </h2>
      <p className="text-xs text-stone-400">선택 사항 · 비워두면 &ldquo;당신&rdquo;으로 불러드려요</p>
      <input
        type="text"
        placeholder="닉네임 (예: 지은, 민준)"
        value={answers.nickname}
        onChange={(e) => setAnswers((a) => ({ ...a, nickname: e.target.value }))}
        maxLength={20}
        className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white text-stone-800 placeholder-stone-400 outline-none focus:border-stone-400 transition-colors text-sm"
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-stone-800 text-white text-sm disabled:opacity-50 transition-opacity"
      >
        {loading ? "잠깐만요..." : "편지 받기 시작"}
      </button>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-6 py-20">
      <main className="w-full max-w-lg flex flex-col gap-8">
        {/* 진행 표시 */}
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-stone-800" : "bg-stone-200"}`}
            />
          ))}
        </div>

        {steps[step]}

        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            ← 이전
          </button>
        )}
      </main>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingForm />
    </Suspense>
  );
}
