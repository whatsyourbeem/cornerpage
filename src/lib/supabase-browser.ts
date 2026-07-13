import { createBrowserClient } from "@supabase/ssr";

/**
 * 클라이언트 컴포넌트(로그인 버튼 등)에서 세션 쿠키를 다루는 브라우저 클라이언트.
 * publishable key만 쓰므로 RLS로 접근이 제한된다.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
