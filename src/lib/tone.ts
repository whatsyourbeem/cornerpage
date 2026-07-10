import type { AxisATone, AxisBLayout, Meta } from "./content-types";
import { deriveBrandPalette } from "./color";

export type ToneSlug = "warm" | "trust" | "driven";

export const TONE_SLUG: Record<AxisATone, ToneSlug> = {
  감성형: "warm",
  신뢰형: "trust",
  혼합형: "driven",
};

export const TONE_FROM_SLUG: Record<ToneSlug, AxisATone> = {
  warm: "감성형",
  trust: "신뢰형",
  driven: "혼합형",
};

export type LayoutSlug = "gallery" | "menu" | "none";

export const LAYOUT_SLUG: Record<AxisBLayout, LayoutSlug> = {
  갤러리우선: "gallery",
  메뉴우선: "menu",
  해당없음: "none",
};

export const LAYOUT_FROM_SLUG: Record<LayoutSlug, AxisBLayout> = {
  gallery: "갤러리우선",
  menu: "메뉴우선",
  none: "해당없음",
};

/**
 * globals.css [data-tone] 블록의 --paper 값과 반드시 동일하게 유지할 것.
 * brand_color의 WCAG 대비를 JS에서 계산하려면 실제 배경색 값이 필요한데,
 * CSS 커스텀 프로퍼티는 DOM 없이 읽을 수 없어 여기 미러링해둔다.
 */
const TONE_PAPER: Record<ToneSlug, string> = {
  warm: "#f7f3ec",
  trust: "#f4f5f6",
  driven: "#f5f4f0",
};

/**
 * meta.brand_color가 있으면 --brand/--brand-deep/--accent/--button-text를
 * 오버라이드할 인라인 스타일을 만든다. 타이포·모션·시그니처 요소 같은 구조적 토큰은
 * 건드리지 않는다(design-guide.md 3-4). null이면 톤 기본 팔레트를 그대로 쓰도록 undefined.
 */
export function resolveBrandCssVars(
  meta: Pick<Meta, "axis_a_tone" | "brand_color">
): Record<string, string> | undefined {
  if (!meta.brand_color) return undefined;
  const toneSlug = TONE_SLUG[meta.axis_a_tone];
  const palette = deriveBrandPalette(meta.brand_color, TONE_PAPER[toneSlug]);
  return {
    "--brand": palette.brand,
    "--brand-deep": palette.brandDeep,
    "--accent": palette.accent,
    "--accent-on-dark": palette.accentOnDark,
    "--button-text": palette.buttonText,
  };
}

/** topbar/sticky_cta는 항상 고정 위치이므로 제외, 스크롤 본문 블록 순서만 정의 */
export const LAYOUT_ORDER: Record<AxisBLayout, string[]> = {
  갤러리우선: [
    "hero",
    "trust_strip",
    "gallery",
    "menu",
    "about",
    "reviews",
    "how_it_works",
    "faq",
    "info",
  ],
  메뉴우선: [
    "hero",
    "trust_strip",
    "about",
    "menu",
    "gallery",
    "reviews",
    "how_it_works",
    "faq",
    "info",
  ],
  해당없음: [
    "hero",
    "trust_strip",
    "about",
    "menu",
    "reviews",
    "how_it_works",
    "faq",
    "info",
  ],
};
