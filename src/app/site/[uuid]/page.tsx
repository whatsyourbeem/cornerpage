import { notFound } from "next/navigation";
import { MiniHomepageSite } from "@/components/site/MiniHomepageSite";
import { getSiteById } from "@/lib/sites";

/**
 * {uuid}.cornerpage.co의 실제 서빙 경로 (src/proxy.ts가 여기로 rewrite한다).
 * Supabase sites 테이블을 uuid로 조회해 그대로 렌더러에 넘긴다 — LLM 호출 없이
 * 결정적으로 동작하는 2단계 그 자체.
 */
export default async function SitePage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const site = await getSiteById(uuid);
  if (!site) notFound();

  return <MiniHomepageSite content={site.content_json} />;
}
