import type { Metadata } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "./globals.css";

const notoSerifKR = Noto_Serif_KR({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-noto-serif-kr",
});

export const metadata: Metadata = {
  title: "sand — 당신의 안부가 궁금한 AI 편지 친구",
  description: "하루 한 통, 당신의 이야기를 듣고 싶은 AI 편지 친구예요.",
  openGraph: {
    title: "sand — 당신의 안부가 궁금한 AI 편지 친구",
    description: "하루 한 통, 당신의 이야기를 듣고 싶은 AI 편지 친구예요.",
    url: "https://fromsand.shop",
    siteName: "sand",
    images: [
      {
        url: "https://fromsand.shop/sand-og-image.png",
        width: 1200,
        height: 630,
        alt: "sand — 당신의 안부가 궁금한 AI 편지 친구",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {GA_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}');
                `,
              }}
            />
          </>
        )}
      </head>
      <body className={`${notoSerifKR.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
