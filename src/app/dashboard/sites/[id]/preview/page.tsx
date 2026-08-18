import { notFound, redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { SiteRow } from "@/lib/sites";
import type { MiniHomepageContent } from "@/lib/content-types-boutique-fitness";
import { EDITABLE_VERTICALS, type Vertical } from "@/lib/verticals";
import { DraftPreview } from "./DraftPreview";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 편집기 미리보기 iframe의 내용물. 공개 사이트(/site/[slug])와 달리 소유자만 열 수
 * 있다 — 저장 전 편집 중인 내용을 보여주는 화면이라 남에게 노출될 이유가 없다.
 */
export default async function SitePreviewFramePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/dashboard/sites/${id}`);
  }

  const { data } = await supabase.from("sites").select("*").eq("id", id).maybeSingle();
  const site = data as SiteRow | null;

  if (!site || site.owner_id !== user.id) notFound();
  if (!EDITABLE_VERTICALS.includes(site.vertical as Vertical)) notFound();

  return <DraftPreview initialContent={site.content_json as MiniHomepageContent} />;
}
