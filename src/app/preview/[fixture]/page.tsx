import { notFound } from "next/navigation";
import { MiniHomepageSite } from "@/components/site/MiniHomepageSite";
import { FIXTURES } from "@/content/fixtures";
import {
  LAYOUT_FROM_SLUG,
  LAYOUT_SLUG,
  TONE_FROM_SLUG,
  TONE_SLUG,
  type LayoutSlug,
  type ToneSlug,
} from "@/lib/tone";
import { ToneSwitcher } from "./ToneSwitcher";

export function generateStaticParams() {
  return Object.keys(FIXTURES).map((fixture) => ({ fixture }));
}

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export default async function PreviewFixturePage({
  params,
  searchParams,
}: {
  params: Promise<{ fixture: string }>;
  searchParams: Promise<{ tone?: string; layout?: string; brand?: string }>;
}) {
  const { fixture } = await params;
  const { tone, layout, brand } = await searchParams;
  const original = FIXTURES[fixture];
  if (!original) notFound();

  const activeTone: ToneSlug =
    (tone as ToneSlug) in TONE_FROM_SLUG
      ? (tone as ToneSlug)
      : TONE_SLUG[original.meta.axis_a_tone];
  const activeLayout: LayoutSlug =
    (layout as LayoutSlug) in LAYOUT_FROM_SLUG
      ? (layout as LayoutSlug)
      : LAYOUT_SLUG[original.meta.axis_b_layout];
  const activeBrand: string | null =
    brand === "off" ? null : brand && HEX_RE.test(brand) ? brand : original.meta.brand_color;

  const content = {
    ...original,
    meta: {
      ...original.meta,
      axis_a_tone: TONE_FROM_SLUG[activeTone],
      axis_b_layout: LAYOUT_FROM_SLUG[activeLayout],
      brand_color: activeBrand,
    },
  };

  return (
    <>
      <ToneSwitcher
        activeTone={activeTone}
        activeLayout={activeLayout}
        activeBrand={activeBrand}
      />
      <MiniHomepageSite content={content} />
    </>
  );
}
