/**
 * meta.brand_color(사장님 지정 hex)를 씨앗 색으로 삼아 --brand/--brand-deep/--accent/
 * --button-text 전체 팔레트를 결정적으로 유도한다. design-guide.md 3-4/3-5 참고.
 */

type Rgb = { r: number; g: number; b: number };
type Hsl = { h: number; s: number; l: number };

function hexToRgb(hex: string): Rgb {
  const m = hex.replace("#", "");
  return {
    r: parseInt(m.slice(0, 2), 16),
    g: parseInt(m.slice(2, 4), 16),
    b: parseInt(m.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (n: number) =>
    Math.round(Math.min(255, Math.max(0, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rN:
      h = (gN - bN) / d + (gN < bN ? 6 : 0);
      break;
    case gN:
      h = (bN - rN) / d + 2;
      break;
    default:
      h = (rN - gN) / d + 4;
  }
  return { h: h / 6, s, l };
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
}

function channelLuminance(c: number) {
  const cN = c / 255;
  return cN <= 0.03928 ? cN / 12.92 : Math.pow((cN + 0.055) / 1.055, 2.4);
}

function relativeLuminance({ r, g, b }: Rgb) {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexToRgb(hexA));
  const lB = relativeLuminance(hexToRgb(hexB));
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** 색조(hue)는 유지한 채, bgHex 위에서 minRatio 대비를 만족할 때까지 명도만 낮춘다. */
function ensureReadableOnLight(hex: string, bgHex: string, minRatio = 4.5): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  let l = hsl.l;
  let candidate = hex;
  let steps = 0;
  while (contrastRatio(candidate, bgHex) < minRatio && l > 0.04 && steps < 40) {
    l -= 0.025;
    candidate = rgbToHex(hslToRgb({ ...hsl, l }));
    steps += 1;
  }
  return candidate;
}

/** 색조는 유지한 채, bgHex(어두운 배경) 위에서 minRatio 대비를 만족할 때까지 명도만 높인다. */
function ensureReadableOnDark(hex: string, bgHex: string, minRatio = 4.5): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  let l = hsl.l;
  let candidate = hex;
  let steps = 0;
  while (contrastRatio(candidate, bgHex) < minRatio && l < 0.96 && steps < 40) {
    l += 0.025;
    candidate = rgbToHex(hslToRgb({ ...hsl, l }));
    steps += 1;
  }
  return candidate;
}

function darken(hex: string, amount: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  const l = Math.max(0, hsl.l - amount);
  return rgbToHex(hslToRgb({ ...hsl, l }));
}

function pickReadableTextColor(bgHex: string): string {
  const white = contrastRatio("#ffffff", bgHex);
  const black = contrastRatio("#111111", bgHex);
  return white >= black ? "#ffffff" : "#111111";
}

export interface BrandPalette {
  brand: string;
  brandDeep: string;
  accent: string;
  accentOnDark: string;
  buttonText: string;
}

/**
 * seedHex: 사장님이 지정한 브랜드 컬러. paperHex: 현재 톤의 배경색(대비 검증 기준).
 * --accent는 브랜드 컬러와 동일하게 맞춘다(스펙에 명시되진 않았지만, 그렇지 않으면
 * 감성형/혼합형 CTA가 브랜드 컬러 대신 톤 기본 액센트색으로 남아 오버라이드가 반쪽만
 * 적용되는 문제가 생긴다 — 구조적 토큰이 아니라 팔레트 레벨의 일관성 문제로 판단).
 *
 * --accent-on-dark는 별도로 유도한다: TrustStrip/Info처럼 --brand-deep을 배경으로 쓰는
 * 다크 밴드 위에서 텍스트로 쓰이는 색인데, brand/accent는 paper(밝은 배경) 기준으로만
 * 대비를 맞춘 값이라 어두운 배경 위에서는 대비가 부족하다(같은 색을 밝은/어두운 배경
 * 양쪽에서 4.5:1을 만족시키는 것은 수학적으로 불가능 — paper와 brand-deep의 명도差가 큼).
 */
export function deriveBrandPalette(seedHex: string, paperHex: string): BrandPalette {
  const brand = ensureReadableOnLight(seedHex, paperHex, 4.5);
  const brandDeep = darken(brand, 0.16);
  const accentOnDark = ensureReadableOnDark(seedHex, brandDeep, 4.5);
  return {
    brand,
    brandDeep,
    accent: brand,
    accentOnDark,
    buttonText: pickReadableTextColor(brand),
  };
}
