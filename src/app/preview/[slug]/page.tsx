import { notFound } from "next/navigation";
import { MiniHomepageSite } from "@/components/site/MiniHomepageSite";
import { getSiteBySlug } from "@/lib/sites";
import {
  LAYOUT_FROM_SLUG,
  LAYOUT_SLUG,
  TONE_FROM_SLUG,
  TONE_SLUG,
  type LayoutSlug,
  type ToneSlug,
} from "@/lib/tone";
import { ToneSwitcher } from "./ToneSwitcher";

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

/**
 * 개발용 프리뷰 — DB에 저장된 실제 콘텐츠를 그대로 렌더링하되, 톤/레이아웃/
 * 브랜드컬러를 쿼리 파라미터로 오버라이드해서 디자인 디테일을 확인할 수 있다.
 * /site/[slug]와 데이터 소스는 동일(getSiteBySlug), 개발용 스위처만 얹은 것.
 */
export default async function PreviewSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tone?: string; layout?: string; brand?: string }>;
}) {
  const { slug } = await params;
  const { tone, layout, brand } = await searchParams;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  const original = site.content_json;

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
