import { supabase } from "./supabase";
import type { MiniHomepageContent } from "./content-types";

export interface SiteRow {
  id: string;
  business_name: string;
  content_json: MiniHomepageContent;
  created_at: string;
  updated_at: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getSiteById(id: string): Promise<SiteRow | null> {
  if (!UUID_RE.test(id)) return null;

  const { data, error } = await supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getSiteById failed:", error.message);
    return null;
  }
  return data as SiteRow | null;
}
