import Link from "next/link";
import Image from "next/image";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center px-6 py-20">
      <main className="w-full max-w-2xl">

        <Image src="/sand-logo.png" alt="sand" width={90} height={45} className="mb-6" style={{ marginLeft: '-6px' }} />

        <h1
          className="text-2xl text-stone-800 mb-10"
          style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}
        >
          이용약관
        </h1>

        <div className="text-stone-600 text-sm leading-7 flex flex-col gap-8">

          <section>
            <h2 className="text-stone-800 font-medium mb-2">1. 서비스 소개</h2>
            <p>
              sand는 AI 기반 감정 지원 이메일 편지 서비스입니다.
              사용자와 AI가 이메일을 통해 편지를 주고받으며, 감정적 지지와 공감을 제공합니다.
            </p>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">2. 의료 서비스가 아닙니다</h2>
            <p>
              sand는 의료, 심리상담, 정신건강 치료 서비스가 <strong>아닙니다</strong>.
              sand의 편지는 전문 상담사나 의사의 조언을 대체할 수 없습니다.
              정신건강 관련 전문적인 도움이 필요하신 경우, 아래 기관에 연락해주세요.
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>자살예방상담전화: 1393 (24시간)</li>
              <li>정신건강 위기상담전화: 1577-0199 (24시간)</li>
              <li>생명의전화: 1588-9191 (24시간)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">3. 이용 조건</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>만 14세 이상의 사용자만 이용할 수 있습니다.</li>
              <li>하루 1회 답장 제한이 있습니다.</li>
              <li>AI 편지는 12~24시간 후 발송됩니다.</li>
              <li>서비스는 무료 베타로 운영되며, 사전 고지 후 변경될 수 있습니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">4. 위기 상황 감지</h2>
            <p>
              sand는 사용자의 편지에서 위기 키워드(자해, 자살 관련)를 감지합니다.
              감지 시 즉시 위기자원 안내 이메일을 발송합니다.
              이는 자동화된 시스템이며, 전문 상담을 대체하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">5. 구독 해지</h2>
            <p>
              모든 이메일 하단의 &quot;구독 해지&quot; 링크를 통해 언제든 해지할 수 있습니다.
              해지 시 예약된 편지는 취소되며, 더 이상 이메일이 발송되지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">6. 면책 조항</h2>
            <p>
              sand는 AI가 생성한 편지의 내용에 대해 완전한 정확성이나 적합성을 보장하지 않습니다.
              sand 이용으로 인한 직접적 또는 간접적 손해에 대해 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">7. 약관 변경</h2>
            <p>
              본 약관은 서비스 개선을 위해 변경될 수 있으며,
              변경 시 이메일 또는 서비스 내 공지를 통해 안내합니다.
            </p>
          </section>

          <p className="text-xs text-stone-400 mt-4">
            시행일: 2026년 3월 2일
          </p>

        </div>

        <div className="mt-12 flex gap-4 text-sm">
          <Link href="/privacy" className="text-stone-500 hover:text-stone-700 underline">
            개인정보처리방침
          </Link>
          <Link href="/" className="text-stone-500 hover:text-stone-700 underline">
            홈으로
          </Link>
        </div>

      </main>
    </div>
  );
}
