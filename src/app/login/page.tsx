"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui";

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
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-cp-canvas px-5 text-center text-cp-fg">
      <p className="text-[13px] font-bold tracking-wide text-cp-muted">CORNERPAGE</p>
      <h1 className="text-cp-h4 font-bold">로그인</h1>
      <p className="max-w-xs text-[14px] text-cp-body">홈페이지를 만들려면 먼저 로그인해주세요.</p>
      <Button variant="outline" size="lg" onClick={handleGoogleLogin} className="mt-2">
        Google로 계속하기
      </Button>
      {process.env.NODE_ENV !== "production" && (
        <button
          onClick={handleDevLogin}
          className="mt-1 rounded-cp-btn-md border border-dashed border-cp-border px-4 py-2 text-[13px] font-semibold text-cp-muted hover:bg-cp-surface"
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
