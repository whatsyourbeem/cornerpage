import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});

export const metadata: Metadata = {
  title: "cornerpage",
  description: "소상공인을 위한 미니홈페이지 빌더",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <head>
        {/*
          톤 전용 서체: Jua(감성형)·Noto Sans KR(신뢰형)·Nanum Gothic(혼합형).
          next/font/google의 번들 메타데이터엔 이 폰트들의 "korean" subset이
          빠져 있어(라틴만 인식) next/font로는 한글이 안 나온다. Google Fonts CDN
          스타일시트로 직접 로드 — unicode-range로 청크가 나뉘어 있어 실제 쓰는
          글자의 청크만 지연 로드된다.
        */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Jua&family=Noto+Sans+KR:wght@400;500;700;900&family=Nanum+Gothic:wght@400;700;800&subset=korean&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
