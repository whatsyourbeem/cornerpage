import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        gap: 16,
        textAlign: "center",
        padding: 20,
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 700, color: "#999", letterSpacing: "0.02em" }}>CORNERPAGE</p>
      <h1 style={{ fontSize: 32, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
        질문에 답하기만 하면
        <br />
        내 가게 홈페이지가 만들어져요
      </h1>
      <p style={{ color: "#666", fontSize: 14, maxWidth: 360 }}>
        업종·메뉴·사진만 넣어주시면 나머지는 저희가 알아서 채워드려요.
      </p>
      <Link
        href="/create"
        style={{
          marginTop: 8,
          padding: "16px 32px",
          borderRadius: 8,
          background: "#111",
          color: "white",
          fontWeight: 700,
          fontSize: 16,
          textDecoration: "none",
        }}
      >
        내 홈페이지 만들기 →
      </Link>
      {user ? (
        <Link href="/dashboard" style={{ fontSize: 13, color: "#666" }}>
          마이페이지
        </Link>
      ) : (
        <Link href="/login" style={{ fontSize: 13, color: "#666" }}>
          로그인
        </Link>
      )}
    </main>
  );
}
