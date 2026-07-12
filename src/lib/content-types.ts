/**
 * 미니홈페이지빌더 콘텐츠 JSON 타입 정의
 * references/content.schema.json과 1:1 대응. 스키마가 진실의 원천(source of truth)이며,
 * 이 파일은 TypeScript 개발 편의를 위한 파생물이다. 스키마가 바뀌면 이 파일도 함께 갱신한다.
 */

// ---------- 공통 타입 ----------

export type AxisATone = "감성형" | "신뢰형" | "혼합형";
export type AxisBLayout = "갤러리우선" | "메뉴우선" | "해당없음";
export type CtaPrimaryAction = "reservation" | "call" | "direction";
export type CtaInteractionMode = "functional" | "guided";
export type CtaType = "call" | "reservation" | "direction" | "dm";

export interface CTA {
  type: CtaType;
  label: string;
}

// ---------- meta ----------

export interface Meta {
  business_name: string;
  industry_category: string;
  axis_a_tone: AxisATone;
  axis_b_layout: AxisBLayout;
  cta_primary_action: CtaPrimaryAction;
  cta_interaction_mode: CtaInteractionMode;
  /** 없으면 null → 렌더러가 텍스트 로고타입 폴백 */
  logo_url: string | null;
  /**
   * 사장님 지정 브랜드 컬러(hex, 예: "#4A9FD8"). 프론트엔드가 컬러피커·로고추출을 통해
   * 이미 확정한 값을 그대로 전달받음 — 스킬은 이 값을 생성·판단하지 않고 통과시키기만 한다.
   * null이면 렌더러가 axis_a_tone의 기본 팔레트를 사용한다(톤 결정 이전에는 색을 확정할 수 없으므로,
   * "지정 안 함"은 반드시 null로 전달되어야 하며 프론트엔드가 임의 기본색을 대신 넣으면 안 된다).
   */
  brand_color: string | null;
}

// ---------- 블록 0: topbar ----------

export interface Topbar {
  display_name: string;
  action_button: CTA;
}

// ---------- 블록 1: hero ----------

export interface Hero {
  badge: string;
  headline: string;
  tagline: string;
  /** 없으면 null → 렌더러가 단색+타이포 폴백 */
  background_image_url: string | null;
  cta: CTA;
}

// ---------- 블록 2: trust_strip ----------

export interface TrustStripItem {
  value: string;
  label: string;
}

export interface TrustStrip {
  /** 정확히 3개 */
  items: [TrustStripItem, TrustStripItem, TrustStripItem];
}

// ---------- 블록 3: about (선택) ----------

export interface About {
  /** 기본 소개, 2~3문장. STEP3 "한 줄 소개·가게 소개" 답변 기반 */
  body: string | null;
  /** 계기·철학 답변 기반(선택). Manifesto 변형(큰 타이포 강조) 렌더링 후보 */
  philosophy: string | null;
  /** 공간·분위기 답변 기반(선택) */
  atmosphere: string | null;
  signature_quote: string | null;
  supporting_image_url: string | null;
}

// ---------- 블록 4: menu (모드에 따라 분기) ----------

export type MenuMode = "item_price" | "item_consult" | "package_table";

export interface MenuItem {
  name: string;
  /** item_consult 모드면 항상 null → 렌더러가 "상담 문의" 표시 */
  price: string | null;
  description: string | null;
  image_url: string | null;
  /** 인기·시그니처 등, 최대 1~2개 항목에만 */
  badge: string | null;
}

export interface MenuTier {
  label: string;
  price: string;
}

export interface MenuCategory {
  category_name: string;
  tiers: MenuTier[];
  representative_tier_index: number;
}

/** mode에 따라 items/categories가 상호 배타적으로 채워진다 (판별 유니온) */
export type Menu =
  | {
      label: string;
      mode: "item_price" | "item_consult";
      /** 대표 1~3개만. 하한 강제 없음(최소 1개) */
      items: MenuItem[];
      categories: null;
      full_list_link_enabled: boolean;
    }
  | {
      label: string;
      mode: "package_table";
      items: null;
      categories: MenuCategory[];
      full_list_link_enabled: boolean;
    };

// ---------- 블록 5: gallery (선택) ----------

export interface Gallery {
  images: string[];
  more_link_url: string | null;
}

// ---------- 블록 6: reviews (선택) ----------

export interface ReviewItem {
  /** 유저 입력 원문 그대로. 가공·재작성 금지 */
  body: string;
  rating: number | null;
  author: string;
  source: string | null;
}

export interface Reviews {
  items: ReviewItem[];
}

// ---------- 블록 7: info ----------

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export interface HoursStructuredEntry {
  day: DayOfWeek;
  open: string | null;
  close: string | null;
  break: [string, string] | null;
  last_order: string | null;
  closed: boolean;
}

export type Hours =
  | { type: "24h"; structured: null }
  | { type: "structured"; structured: HoursStructuredEntry[] };

export type ExternalLinkPlatform = "instagram" | "kakao" | "naver_reservation" | "blog";

export interface ExternalLink {
  platform: ExternalLinkPlatform;
  url: string;
}

export interface BusinessInfo {
  registered_name: string;
  ceo_name: string;
  registration_number: string;
}

export interface Info {
  address: string;
  map_coordinates: { lat: number; lng: number };
  hours: Hours;
  phone: string;
  external_links: ExternalLink[];
  /** 업종 무관 공통 선택 슬롯 */
  business_info: BusinessInfo | null;
}

// ---------- 블록 8: sticky_cta ----------

export interface StickyCtaButton {
  type: CtaType;
  label: string;
  /** 전화번호 또는 URL */
  action_value: string;
}

export interface StickyCta {
  /** 최대 2개 (메인 + 보조) */
  buttons: StickyCtaButton[];
}

// ---------- 블록 9: how_it_works (선택) ----------

export interface HowItWorksStep {
  order: number;
  title: string;
  description: string;
}

export interface HowItWorks {
  /** 2~4단계 */
  steps: HowItWorksStep[];
}

// ---------- 블록 10: faq (선택) ----------

export interface FaqItem {
  question: string;
  /** 사장님 입력 사실 그대로. 지어내기 금지 */
  answer: string;
}

export interface Faq {
  items: FaqItem[];
}

// ---------- blocks 전체 ----------

export interface Blocks {
  topbar: Topbar;
  hero: Hero;
  trust_strip: TrustStrip;
  about: About | null;
  menu: Menu;
  gallery: Gallery | null;
  reviews: Reviews | null;
  info: Info;
  sticky_cta: StickyCta;
  how_it_works: HowItWorks | null;
  faq: Faq | null;
}

// ---------- 최상위 ----------

/** 스킬(Claude)의 출력 및 렌더러(디자인 템플릿)의 입력 계약 */
export interface MiniHomepageContent {
  meta: Meta;
  blocks: Blocks;
}
