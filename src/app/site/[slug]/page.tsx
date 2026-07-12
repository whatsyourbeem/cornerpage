import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MiniHomepageSite } from "@/components/site/MiniHomepageSite";
import { getSiteBySlug } from "@/lib/sites";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) return {};

  return {
    title: `${site.content_json.meta.business_name} - cornerpage`,
  };
}

/**
 * {slug}.cornerpage.co의 실제 서빙 경로 (src/proxy.ts가 여기로 rewrite한다).
 * Supabase sites 테이블을 slug로 조회해 그대로 렌더러에 넘긴다 — LLM 호출 없이
 * 결정적으로 동작하는 2단계 그 자체.
 */
export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  return <MiniHomepageSite content={site.content_json} />;
}
