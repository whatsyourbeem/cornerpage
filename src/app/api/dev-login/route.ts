import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// 실제 비밀도 아니고(고정된 로컬 테스트 계정 하나뿐), 이 라우트 자체가 프로덕션
// 빌드에서 404로 막히므로 코드에 그대로 둬도 문제없다.
const TEST_EMAIL = "dev-test@cornerpage.local";
const TEST_PASSWORD = "cornerpage-dev-test-only";

/**
 * 로컬 개발 전용 로그인 우회 — 매번 Google OAuth를 거치지 않고 고정 테스트
 * 계정으로 즉시 세션을 발급한다. `next build`는 Vercel의 preview/production
 * 배포 양쪽 다 NODE_ENV를 "production"으로 세팅하므로(로컬 `next dev`만
 * "development"), 이 체크 하나로 배포된 환경에는 절대 노출되지 않는다 — 클라
 * 이언트 쪽(login/page.tsx) 버튼 노출 여부도 같은 값으로 판단하지만, 여기
 * 서버에서도 독립적으로 다시 막는다(클라 체크 우회 방지).
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // 테스트 계정이 이미 있으면 에러가 나는데(정상), 무시하고 로그인을 시도한다.
  await supabaseAdmin.auth.admin
    .createUser({ email: TEST_EMAIL, password: TEST_PASSWORD, email_confirm: true })
    .catch(() => {});

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    console.error("dev-login 실패:", error.message);
    return NextResponse.json({ error: "테스트 로그인에 실패했어요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
