import Link from "next/link";
import Image from "next/image";

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center justify-center px-6 py-20">
      <main className="w-full max-w-lg flex flex-col gap-8 text-center">

        <div className="flex flex-col gap-4">
          <Image src="/sand-logo.png" alt="sand" width={90} height={45} style={{ margin: '0 auto' }} />
          <h1
            className="text-2xl leading-snug text-stone-800"
            style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}
          >
            지금 sand가 편지를 쓰고 있어요.<br />
            잠시 후 이메일로 도착할 거예요.
          </h1>
          <p className="text-stone-500 leading-relaxed text-sm">
            답장하면 또 와요. 짧아도 괜찮아요.
          </p>
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
