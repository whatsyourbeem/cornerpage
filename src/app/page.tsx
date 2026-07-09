import Link from "next/link";

export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        gap: 12,
        textAlign: "center",
        padding: 20,
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 800 }}>cornerpage</h1>
      <p style={{ color: "#666", fontSize: 14 }}>
        입력 폼은 아직 없습니다. 지금은 디자인 템플릿 렌더러를 개발 중입니다.
      </p>
      <Link href="/preview" style={{ color: "#2563eb", fontWeight: 600 }}>
        디자인 템플릿 프리뷰 보기 →
      </Link>
    </main>
  );
}
