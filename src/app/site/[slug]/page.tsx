import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MiniHomepageSite } from "@/components/site/MiniHomepageSite";
import { BoutiqueFitnessSite } from "@/components/site-boutique-fitness/BoutiqueFitnessSite";
import { getSiteBySlug } from "@/lib/sites";
import type { MiniHomepageContent as GeneralContent } from "@/lib/content-types";
import type { MiniHomepageContent as BoutiqueFitnessContent } from "@/lib/content-types-boutique-fitness";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) return {};

  const content = site.content_json as { meta: { business_name: string } };
  return {
    title: `${content.meta.business_name} - cornerpage`,
    ...(slug === "sambo-total" && {
      verification: {
        google: "o0ZPnf0gKPwYu5EQB3W50V26cL_5VWH3c--a7QUevqs",
      },
    }),
  };
}

/**
 * {slug}.cornerpage.co의 실제 서빙 경로 (src/proxy.ts가 여기로 rewrite한다).
 * Supabase sites 테이블을 slug로 조회해, vertical에 맞는 렌더러로 dispatch한다 —
 * LLM 호출 없이 결정적으로 동작하는 2단계 그 자체.
 */
export default async function SitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  if (site.vertical === "boutique-fitness") {
    return <BoutiqueFitnessSite content={site.content_json as BoutiqueFitnessContent} />;
  }
  return <MiniHomepageSite content={site.content_json as GeneralContent} />;
}
