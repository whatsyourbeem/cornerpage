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

export default async function PreviewSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  return <MiniHomepageSite content={site.content_json} />;
}
