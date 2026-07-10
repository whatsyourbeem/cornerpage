import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * service_role(secret key) 클라이언트 — RLS를 우회한다. API 라우트 등
 * 서버 전용 코드에서만 import할 것. "server-only"가 클라이언트 번들에
 * 실수로 섞여 들어가면 빌드 타임에 에러를 내준다.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);
