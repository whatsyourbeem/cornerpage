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
          본문·UI는 전 톤 공통 Pretendard(자체 호스팅, layout.tsx 상단).
          히어로 헤드라인에만 톤별 개성 서체를 얹는다: 감성형 Gmarket Sans,
          혼합형 S-Core Dream(신뢰형은 별도 서체 없이 Pretendard Black 굵기로).
          둘 다 next/font/google 번들 메타데이터에 korean subset이 없어
          커뮤니티 CDN(jsdelivr, fonts-archive) 스타일시트로 직접 로드한다.
        */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/fonts-archive/GmarketSans/GmarketSans.css"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/fonts-archive/S-CoreDream/S-CoreDream.css"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
