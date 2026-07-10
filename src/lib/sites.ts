import { supabase } from "./supabase";
import type { MiniHomepageContent } from "./content-types";

export interface SiteRow {
  id: string;
  slug: string;
  business_name: string;
  content_json: MiniHomepageContent;
  created_at: string;
  updated_at: string;
}

/** DNS 서브도메인 라벨 규칙과 동일 — supabase/migrations의 sites_slug_format 체크와 짝을 맞춘다. */
const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export async function getSiteBySlug(slug: string): Promise<SiteRow | null> {
  if (!SLUG_RE.test(slug)) return null;

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("getSiteBySlug failed:", error.message);
    return null;
  }
  return data as SiteRow | null;
}
