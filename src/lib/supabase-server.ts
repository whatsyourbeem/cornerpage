import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * 서버 컴포넌트/라우트 핸들러에서 요청자의 세션 쿠키를 읽어 인증 상태를
 * 파악하는 클라이언트. publishable key + RLS 하에서 동작하므로 로그인한
 * 본인 소유 데이터만 접근 가능하다 — 서비스 로직상 소유권 확인이 필요한
 * 곳(예: 3개 제한 카운트)은 이 클라이언트로 auth.uid()를 얻은 뒤 처리한다.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 set이 불가능 — proxy.ts가
            // 세션 갱신을 담당하므로 여기서는 무시해도 된다.
          }
        },
      },
    }
  );
}
