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
  };
}

export default async function PreviewSlugPage({
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
