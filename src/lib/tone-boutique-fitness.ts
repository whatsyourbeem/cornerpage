import type { LeadEmphasis, Meta } from "./content-types-boutique-fitness";
import { deriveBrandPalette } from "./color";

/**
 * globals.css [data-tone="grounded"] 블록의 --paper 값과 반드시 동일하게 유지할 것 —
 * tone.ts의 TONE_PAPER와 동일한 이유(CSS 커스텀 프로퍼티는 DOM 없이 JS에서 못 읽는다).
 */
const GROUNDED_PAPER = "#FAF8F5";

/**
 * meta.brand_color가 있으면 --brand/--brand-deep/--accent/--accent-deep/--accent-on-dark/--button-text를
 * 오버라이드할 인라인 스타일을 만든다. general과 달리 axis_a_tone에 따른 톤 분기가 없어
 * paperHex는 이 vertical 고정값 하나뿐이다. design-guide.md 9장: 구조적 토큰(타이포·모션·
 * "accent는 증거·CTA에만" 같은 원칙)은 브랜드 컬러 유무와 무관하게 유지된다 — 여기서 건드리지 않는다.
 */
export function resolveBrandCssVars(
  meta: Pick<Meta, "brand_color">
): Record<string, string> | undefined {
  if (!meta.brand_color) return undefined;
  const palette = deriveBrandPalette(meta.brand_color, GROUNDED_PAPER);
  return {
    "--brand": palette.brand,
    "--brand-deep": palette.brandDeep,
    "--accent": palette.accent,
    "--accent-deep": palette.accentDeep,
    "--accent-on-dark": palette.accentOnDark,
    "--button-text": palette.buttonText,
  };
}

type EvidenceKey = "transformations" | "reviews" | "professionals";

/** design-guide.md 5장: lead_emphasis는 증거 클러스터(transformations/reviews/professionals)
 * 내부 순서만 바꾼다 — facility 전체를 클러스터 앞으로 빼는 것은 buildLayoutOrder에서 별도 처리. */
function evidenceClusterOrder(leadEmphasis: LeadEmphasis): EvidenceKey[] {
  switch (leadEmphasis) {
    case "reviews":
      return ["reviews", "transformations", "professionals"];
    case "professionals":
      return ["professionals", "transformations", "reviews"];
    default:
      // "facility" · "transformations" · null 전부 클러스터 내부 순서는 기본값을 쓴다.
      return ["transformations", "reviews", "professionals"];
  }
}

/**
 * topbar/sticky_cta는 항상 고정 위치라 제외, 스크롤 본문 블록 순서만 정의한다.
 * design-guide.md 5장: facility가 lead_emphasis로 선택된 경우에만 예외적으로 4번
 * 클러스터(gallery+facility)에서 분리되어 증거 클러스터 맨 앞(3번 자리)으로 이동한다.
 * atmosphere는 2026-07-17부터 별도 블록이 아니라 facility.atmosphere_text로 흡수됨.
 */
export function buildLayoutOrder(leadEmphasis: LeadEmphasis): string[] {
  const facilityFirst = leadEmphasis === "facility";
  return [
    "hero",
    "trust_strip",
    ...(facilityFirst ? ["facility"] : []),
    ...evidenceClusterOrder(leadEmphasis),
    "philosophy",
    "gallery",
    ...(facilityFirst ? [] : ["facility"]),
    "menu",
    "info",
    "how_it_works",
    "faq",
  ];
}
