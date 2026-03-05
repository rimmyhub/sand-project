import Link from "next/link";
import Image from "next/image";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#faf9f7] flex flex-col items-center px-6 py-20">
      <main className="w-full max-w-2xl">

        <Image src="/sand-logo.png" alt="sand" width={90} height={34} className="mb-6" />

        <h1
          className="text-2xl text-stone-800 mb-10"
          style={{ fontFamily: "var(--font-noto-serif-kr), Georgia, serif" }}
        >
          개인정보처리방침
        </h1>

        <div className="text-stone-600 text-sm leading-7 flex flex-col gap-8">

          <section>
            <h2 className="text-stone-800 font-medium mb-2">1. 수집하는 개인정보</h2>
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2 pr-4 text-stone-700">항목</th>
                  <th className="text-left py-2 text-stone-700">수집 목적</th>
                </tr>
              </thead>
              <tbody className="text-stone-600">
                <tr className="border-b border-stone-100">
                  <td className="py-2 pr-4">이메일 주소</td>
                  <td className="py-2">편지 발송, 계정 식별</td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="py-2 pr-4">닉네임 (선택)</td>
                  <td className="py-2">편지 내 호칭</td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="py-2 pr-4">온보딩 설문 응답</td>
                  <td className="py-2">AI 편지 개인화 (감정, 주제, 선호 톤)</td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="py-2 pr-4">편지 내용</td>
                  <td className="py-2">AI 답장 생성을 위한 맥락</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">2. 개인정보 이용 목적</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>AI 편지 생성 및 발송</li>
              <li>위기 키워드 감지 및 위기자원 안내</li>
              <li>서비스 개선 (익명화된 통계 분석)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">3. 개인정보 보관 및 파기</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>구독 해지 시: 30일 후 모든 편지 및 개인정보 삭제</li>
              <li>서비스 종료 시: 종료 안내 후 90일 이내 전체 삭제</li>
              <li>보관 기간 중에도 사용자 요청 시 즉시 삭제 가능</li>
            </ul>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">4. 제3자 제공</h2>
            <p>
              sand는 사용자의 개인정보를 제3자에게 판매하거나 공유하지 않습니다.
              단, 서비스 운영을 위해 아래 서비스를 이용합니다.
            </p>
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2 pr-4 text-stone-700">서비스</th>
                  <th className="text-left py-2 pr-4 text-stone-700">용도</th>
                  <th className="text-left py-2 text-stone-700">처리 데이터</th>
                </tr>
              </thead>
              <tbody className="text-stone-600">
                <tr className="border-b border-stone-100">
                  <td className="py-2 pr-4">Google Gemini</td>
                  <td className="py-2 pr-4">AI 편지 생성</td>
                  <td className="py-2">편지 내용 (프롬프트)</td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="py-2 pr-4">Resend</td>
                  <td className="py-2 pr-4">이메일 발송</td>
                  <td className="py-2">이메일 주소, 편지 본문</td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="py-2 pr-4">Postmark</td>
                  <td className="py-2 pr-4">이메일 수신</td>
                  <td className="py-2">이메일 주소, 답장 본문</td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="py-2 pr-4">Supabase</td>
                  <td className="py-2 pr-4">데이터 저장</td>
                  <td className="py-2">전체 사용자 데이터</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">5. 사용자 권리</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>개인정보 열람, 정정, 삭제를 요청할 수 있습니다.</li>
              <li>구독 해지는 이메일 하단 링크로 언제든 가능합니다.</li>
              <li>데이터 삭제 요청: sand 이메일로 연락해주세요.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">6. 민감 정보 처리</h2>
            <p>
              sand는 감정 관련 정보를 수집합니다. 이는 민감 정보에 해당할 수 있으며,
              AI 편지 개인화 목적으로만 사용됩니다.
              해당 정보는 사용자 동의 하에 수집되며, 구독 해지 시 삭제됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-stone-800 font-medium mb-2">7. 방침 변경</h2>
            <p>
              본 방침은 변경될 수 있으며, 변경 시 이메일 또는 서비스 내 공지를 통해 안내합니다.
            </p>
          </section>

          <p className="text-xs text-stone-400 mt-4">
            시행일: 2026년 3월 2일
          </p>

        </div>

        <div className="mt-12 flex gap-4 text-sm">
          <Link href="/terms" className="text-stone-500 hover:text-stone-700 underline">
            이용약관
          </Link>
          <Link href="/" className="text-stone-500 hover:text-stone-700 underline">
            홈으로
          </Link>
        </div>

      </main>
    </div>
  );
}
