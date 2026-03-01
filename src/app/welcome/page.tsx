import Link from "next/link";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-6 py-20">
      <main className="w-full max-w-lg flex flex-col gap-8 text-center">

        <div className="flex flex-col gap-4">
          <p className="text-sm tracking-widest text-stone-400 uppercase">sand</p>
          <h1
            className="text-2xl leading-snug text-stone-800"
            style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}
          >
            sand가 곧 첫 편지를 쓸 거예요.<br />
            지금쯤 종이를 꺼내고 있을 거예요.
          </h1>
          <p className="text-stone-500 leading-relaxed text-sm">
            빨리 답할 필요 없어요. sand는 기다리는 데 익숙해요.
          </p>
        </div>

        <div
          className="bg-white border border-stone-100 rounded-2xl p-7 shadow-sm text-left"
          style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}
        >
          <p className="text-xs text-stone-400 mb-4">방금 환영 이메일을 보냈어요</p>
          <pre className="text-stone-600 text-sm leading-7 whitespace-pre-wrap">
{`잠깐, 편지 오기 전에 — sand

곧 첫 편지를 쓸게요.

저는 상담사가 아니에요.
그냥 — 당신 이야기를 듣고 싶은 존재예요.

짧게 답장해도 괜찮아요.
기다리고 있을게요.

— sand`}
          </pre>
        </div>

        <Link
          href="/"
          className="w-full py-3 rounded-xl border border-stone-200 text-stone-600 text-sm hover:border-stone-400 transition-colors"
        >
          홈으로
        </Link>

        <p className="text-xs text-stone-400">
          편지가 오지 않으면 스팸함을 확인해주세요.
        </p>

      </main>
    </div>
  );
}
