"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

function LoginContent() {
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

  // next build는 Vercel의 preview·production 배포 모두 NODE_ENV를
  // "production"으로 세팅한다(로컬 next dev만 "development") — 이 버튼은
  // 배포된 환경 어디에도 노출되지 않고 로컬 개발에서만 보인다.
  const handleDevLogin = async () => {
    const res = await fetch("/api/dev-login", { method: "POST" });
    if (res.ok) {
      window.location.href = next;
    } else {
      alert("테스트 로그인에 실패했어요.");
    }
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
      {process.env.NODE_ENV !== "production" && (
        <button
          onClick={handleDevLogin}
          style={{
            marginTop: 4,
            padding: "10px 20px",
            borderRadius: 8,
            border: "1px dashed #bbb",
            background: "#fafafa",
            color: "#666",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          테스트 로그인 (로컬 전용)
        </button>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
