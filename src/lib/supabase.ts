import { createClient } from "@supabase/supabase-js";

/**
 * 공개 읽기 전용 클라이언트(publishable key). sites 테이블은 RLS로 select만
 * anon/authenticated에 열려있고 insert/update/delete는 막혀있다 — 쓰기는
 * 나중에 service_role 키를 쓰는 서버 전용 클라이언트로 별도 구현한다.
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);
