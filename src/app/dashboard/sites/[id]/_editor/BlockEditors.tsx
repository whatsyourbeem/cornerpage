"use client";

import type { Blocks, Meta, MiniHomepageContent } from "@/lib/content-types-boutique-fitness";
import { buildLayoutOrder } from "@/lib/tone-boutique-fitness";
import { MetaEditor } from "./blocks/MetaEditor";
import { TopbarEditor } from "./blocks/TopbarEditor";
import { HeroEditor } from "./blocks/HeroEditor";
import { TrustStripEditor } from "./blocks/TrustStripEditor";
import { TransformationsEditor } from "./blocks/TransformationsEditor";
import { ReviewsEditor } from "./blocks/ReviewsEditor";
import { ProfessionalsEditor } from "./blocks/ProfessionalsEditor";
import { PhilosophyEditor } from "./blocks/PhilosophyEditor";
import { GalleryEditor } from "./blocks/GalleryEditor";
import { FacilityEditor } from "./blocks/FacilityEditor";
import { MenuEditor } from "./blocks/MenuEditor";
import { InfoEditor } from "./blocks/InfoEditor";
import { StickyCtaEditor } from "./blocks/StickyCtaEditor";
import { HowItWorksEditor } from "./blocks/HowItWorksEditor";
import { FaqEditor } from "./blocks/FaqEditor";

/**
 * 블록 편집기 목록. 순서는 buildLayoutOrder(meta.lead_emphasis) — 실제 사이트에
 * 그려지는 순서와 편집 화면의 순서를 일치시킨다. 사장님이 "위에서 세 번째 칸"을
 * 찾을 때 기준이 되는 건 편집기 내부 구조가 아니라 자기 홈페이지의 모양이다.
 *
 * topbar/sticky_cta는 스크롤 본문이 아니라 항상 고정 위치라 buildLayoutOrder에
 * 없다 — 각각 맨 위·맨 아래에 따로 붙인다.
 */
export function BlockEditors({
  siteId,
  content,
  onMetaChange,
  onBlocksChange,
}: {
  siteId: string;
  content: MiniHomepageContent;
  onMetaChange: (meta: Meta) => void;
  onBlocksChange: (updater: (prev: Blocks) => Blocks) => void;
}) {
  const { meta, blocks } = content;

  // 블록 하나만 갈아끼우는 setter. 각 편집기는 자기 블록 값만 알면 되게 한다.
  function set<K extends keyof Blocks>(key: K) {
    return (next: Blocks[K]) => onBlocksChange((prev) => ({ ...prev, [key]: next }));
  }

  const editors: Record<string, React.ReactNode> = {
    hero: <HeroEditor key="hero" siteId={siteId} hero={blocks.hero} onChange={set("hero")} />,
    trust_strip: (
      <TrustStripEditor key="trust_strip" trustStrip={blocks.trust_strip} onChange={set("trust_strip")} />
    ),
    transformations: (
      <TransformationsEditor
        key="transformations"
        siteId={siteId}
        transformations={blocks.transformations}
        onChange={set("transformations")}
      />
    ),
    reviews: <ReviewsEditor key="reviews" reviews={blocks.reviews} onChange={set("reviews")} />,
    professionals: (
      <ProfessionalsEditor
        key="professionals"
        siteId={siteId}
        professionals={blocks.professionals}
        onChange={set("professionals")}
      />
    ),
    philosophy: (
      <PhilosophyEditor key="philosophy" philosophy={blocks.philosophy} onChange={set("philosophy")} />
    ),
    gallery: <GalleryEditor key="gallery" siteId={siteId} gallery={blocks.gallery} onChange={set("gallery")} />,
    facility: (
      <FacilityEditor key="facility" siteId={siteId} facility={blocks.facility} onChange={set("facility")} />
    ),
    menu: <MenuEditor key="menu" siteId={siteId} menu={blocks.menu} onChange={set("menu")} />,
    info: <InfoEditor key="info" info={blocks.info} onChange={set("info")} />,
    how_it_works: (
      <HowItWorksEditor key="how_it_works" howItWorks={blocks.how_it_works} onChange={set("how_it_works")} />
    ),
    faq: <FaqEditor key="faq" faq={blocks.faq} onChange={set("faq")} />,
  };

  return (
    <div className="flex flex-col gap-2.5">
      <MetaEditor siteId={siteId} meta={meta} onChange={onMetaChange} />
      <TopbarEditor topbar={blocks.topbar} onChange={set("topbar")} />
      {buildLayoutOrder(meta.lead_emphasis).map((key) => editors[key] ?? null)}
      <StickyCtaEditor stickyCta={blocks.sticky_cta} onChange={set("sticky_cta")} />
    </div>
  );
}
