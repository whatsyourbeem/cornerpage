"use client";

import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/create";

  const handleGoogleLogin = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

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
      <p style={{ fontSize: 13, fontWeight: 700, color: "#999", letterSpacing: "0.02em" }}>
        CORNERPAGE
      </p>
      <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>로그인</h1>
      <p style={{ color: "#666", fontSize: 14, maxWidth: 320 }}>
        홈페이지를 만들려면 먼저 로그인해주세요.
      </p>
      <button
        onClick={handleGoogleLogin}
        style={{
          marginTop: 8,
          padding: "14px 28px",
          borderRadius: 8,
          border: "1px solid #ddd",
          background: "white",
          color: "#111",
          fontWeight: 700,
          fontSize: 15,
          cursor: "pointer",
        }}
      >
        Google로 계속하기
      </button>
    </main>
  );
}
