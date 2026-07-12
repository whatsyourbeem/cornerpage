import { notFound } from "next/navigation";
import { MiniHomepageSite } from "@/components/site/MiniHomepageSite";
import { getSiteBySlug } from "@/lib/sites";

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
