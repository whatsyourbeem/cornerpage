/**
 * 미니홈페이지빌더 콘텐츠 JSON 타입 정의 — boutique-fitness vertical
 * for-frontend/boutique-fitness/content.schema.json과 1:1 대응. 스키마가 진실의 원천(source of truth)이며,
 * 이 파일은 TypeScript 개발 편의를 위한 파생물이다. 스키마가 바뀌면 이 파일도 함께 갱신한다.
 *
 * general(content.types.ts)과의 주요 차이:
 * - axis_a_tone·axis_b_layout 없음(이 vertical은 톤·레이아웃이 고정) → lead_emphasis로 대체
 * - about 블록 없음(professionals가 그 역할을 흡수)
 * - reviews.items에 trainer_tag 추가
 * - transformations·professionals·facility 신규 블록
 * - professionals는 이 vertical에서 필수 블록(다른 선택 블록들과 달리 null 불가)
 */

// ---------- 공통 타입 ----------

export type LeadEmphasis = "transformations" | "reviews" | "professionals" | "facility" | null;

export type InquiryChannelType = "call" | "naver_reservation" | "kakao" | "instagram_dm" | "other";
export type BrowseChannelType = "kakao" | "naver_blog" | "instagram" | "youtube" | "naver_map" | "other";

/** type이 "other"일 때만 other_label이 채워지고, 그 외엔 반드시 null (스키마 if/then과 1:1 대응) */
export type InquiryChannel =
  | { type: Exclude<InquiryChannelType, "other">; action_value: string; other_label: null }
  | { type: "other"; action_value: string; other_label: string };

export type BrowseChannel =
  | { type: Exclude<BrowseChannelType, "other">; action_value: string; other_label: null }
  | { type: "other"; action_value: string; other_label: string };

// ---------- meta ----------

export interface Meta {
  business_name: string;
  industry_category: string;
  /** 사장님이 가장 자신 있게 내세우고 싶다고 고른 항목. 무응답이면 null → 기본값 transformations로 처리 */
  lead_emphasis: LeadEmphasis;
  /**
   * 예약/문의 채널(전화·네이버예약·카카오톡·인스타DM·기타). 최소 1개.
   * 프론트엔드가 입력 폼에서 이미 확정해 전달 — 스킬은 판단하지 않고 그대로 통과시킨다(brand_color와 동일 패턴).
   * 렌더러는 이 배열을 토대로 상단바·히어로·하단CTA바의 "문의하기" 버튼을 그리고, 버튼 클릭 시 다이얼로그에
   * 채널별 버튼을 나열한다(general처럼 버튼 하나=행동 하나가 아니라, 버튼 하나=다이얼로그 열기).
   */
  inquiry_channels: InquiryChannel[];
  /**
   * 둘러보기 채널(카카오톡·네이버블로그·인스타그램·유튜브·네이버지도·기타). 없으면 null.
   * 마찬가지로 스킬은 판단하지 않고 통과만 시킨다. 히어로에 채널별 버튼으로 나열된다.
   */
  browse_channels: BrowseChannel[] | null;
  /** 없으면 null → 렌더러가 텍스트 로고타입 폴백 */
  logo_url: string | null;
  /**
   * 사장님 지정 브랜드 컬러(hex, 예: "#4A9FD8"). 프론트엔드가 컬러피커·로고추출을 통해
   * 이미 확정한 값을 그대로 전달받음 — 스킬은 이 값을 생성·판단하지 않고 통과시키기만 한다.
   * null이면 렌더러가 이 vertical의 고정 톤("차분한 확신") 팔레트를 사용한다(general처럼 axis_a_tone
   * 기반이 아니라 이 vertical 전용 design-guide.md의 고정 팔레트 — 톤 자체가 업체마다 안 갈리므로).
   */
  brand_color: string | null;
}

// ---------- 블록 0: topbar ----------

export interface Topbar {
  display_name: string;
  /** 저부담 문구만. 클릭 시 meta.inquiry_channels 다이얼로그가 열린다(버튼 자체엔 채널 정보 없음) */
  cta_label: string;
}

// ---------- 블록 1: hero ----------

export interface Hero {
  badge: string;
  /**
   * 정체성·전문성 사실 기반. 증거를 아직 안 보여준 단계라 결과 약속 문구 금지.
   * **줄바꿈은 `\n`으로 명시적으로 지정한다** — 최대 2줄, 각 줄 4~20자.
   * 20자를 넘는 문장을 줄바꿈 없이 넣는 건 스키마가 거부한다(브라우저의 임의 줄바꿈 방지 목적).
   * 좋은 예: `"8년째 재활 전문으로,\n한 사람만 보는 PT"` — 의미 단위로 끊음.
   */
  headline: string;
  /** "나도 할 수 있을까" 불안을 첫 노출로 완화하는 자리(사실 기반일 때만) */
  tagline: string;
  /** 없으면 null → 렌더러가 단색+타이포 폴백 */
  background_image_url: string | null;
  /** 저부담 문구만. 클릭 시 meta.inquiry_channels 다이얼로그가 열린다. meta.browse_channels는
   *  히어로에 별도 버튼 목록으로 렌더러가 직접 그린다(이 필드와 무관, hero 스키마에 없음) */
  cta_label: string;
}

// ---------- 블록 2: trust_strip ----------

export type TrustStripIcon =
  | "Calendar" | "Clock" | "Users" | "Award" | "BadgeCheck"
  | "TrendingUp" | "RefreshCw" | "Heart" | "Star" | "Dumbbell"
  | "MessagesSquare" | "Trophy";

export interface TrustStripItem {
  value: string;
  label: string;
  /** lucide-react 아이콘 컴포넌트명(PascalCase). 이 12개 목록 안에서만 선택 —
   *  지어내거나 오타 내지 않는다. 렌더러가 이 문자열을 그대로 lucide-react 컴포넌트로 매핑한다.
   *  기존에 이 필드 없이 저장된 사이트는 렌더러에서 아이콘 없이(값+라벨만) 폴백 렌더링한다. */
  icon: TrustStripIcon;
}

export interface TrustStrip {
  /** 정확히 3개. 사람·성과 지표 우선 — 시설 지표는 facility 블록으로 */
  items: [TrustStripItem, TrustStripItem, TrustStripItem];
}

// ---------- 블록 3: transformations (신규, 선택이나 사실상 필수급) ----------

export interface TransformationItem {
  before_image_url: string;
  after_image_url: string;
  duration_label: string;
  result_highlight: string;
  /** 익명 처리, 예: '김○영님' */
  member_label: string;
  /** 리뷰 원문에 이름이 실제로 언급된 경우만 — 추론·생성 금지 */
  trainer_tag: string | null;
}

export interface Transformations {
  /** 권장 1~4개 */
  items: TransformationItem[];
}

// ---------- 블록 3-1: reviews (선택이나 사실상 필수급) ----------

export interface ReviewItem {
  /** 유저 입력 원문 그대로. 가공·재작성 금지 */
  body: string;
  rating: number | null;
  author: string;
  source: string | null;
  /** general 대비 추가 필드. 원문에 이름이 실제로 언급된 경우만 — 추론·생성 금지 */
  trainer_tag: string | null;
}

export interface Reviews {
  items: ReviewItem[];
}

// ---------- 블록 3-2: professionals (신규, 이 vertical의 필수 블록) ----------

export interface ProfessionalItem {
  name: string;
  /** 예: '대표 트레이너', '필라테스 강사', '원장' */
  title: string;
  photo_url: string | null;
  /** 실제 보유한 것만. 없으면 빈 배열 — 지어내기 절대 금지 */
  certifications: string[];
  specialty: string;
  years_experience: number | null;
  /** 과장 없이 자연스러운 한 줄 지도철학. 전문성 전달이 목적, 감성적 강조 아님 */
  bio_quote: string;
}

export interface Professionals {
  /** 예: '트레이너 소개', '강사진 소개', '요가 지도자 소개' — 업종 세부유형에 맞게 */
  section_label: string;
  /** 최소 1개. 원장 1인 스튜디오면 1개, 팀이면 N개 */
  items: ProfessionalItem[];
}

// ---------- 블록 3-3: philosophy (선택, general과 위치·범위가 다름) ----------

/**
 * 스튜디오 차원의 창립 계기로 한정(개인 지도 철학은 professionals.bio_quote가 담당).
 * 위치도 general과 다르게 증거 클러스터 뒤로 배치된다.
 */
export interface Philosophy {
  text: string;
}

// ---------- 블록 4-1: gallery (선택, 역할 축소) ----------

export interface Gallery {
  /** professionals·facility·transformations 사진과 중복 배치 금지 — 순수 분위기 사진만 */
  images: string[];
  more_link_url: string | null;
}

// ---------- 블록 4-2: facility (선택) ----------

export interface Facility {
  size_pyeong: number | null;
  has_shower: boolean | null;
  has_locker: boolean | null;
  has_parking: boolean | null;
  /** 구체적 수량과 함께, 예: "리포머 5대" */
  equipment_list: string[] | null;
  /** gallery와 중복 배치 금지 — 이 스펙을 보여주는 용도로만 */
  photos: string[] | null;
  /** 감각적 디테일 위주(공간·소리·조용함 등) 분위기 서술.
   *  2026-07-17부터 별도 atmosphere 블록 대신 여기로 통합됨 — 항상 같은 "공간 클러스터"에
   *  붙어 다니고 독립적으로 위치가 바뀔 일이 없어, 별도 top-level 블록으로 쪼갤 이유가 general만큼
   *  강하지 않았다(general은 atmosphere를 계속 독립 블록으로 유지 — 이 vertical만의 변경). */
  atmosphere_text: string | null;
}

// ---------- 블록 5: menu (모드에 따라 분기, item_consult가 사실상 기본) ----------

export type MenuMode = "item_price" | "item_consult" | "package_table";

export interface MenuItem {
  name: string;
  /** item_consult 모드면 항상 null → 렌더러가 "상담 문의" 표시. 이 vertical은 item_consult가 기본 */
  price: string | null;
  description: string | null;
  image_url: string | null;
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
      /** "메뉴"라는 단어 대신 업종 언어로: "PT 프로그램", "수업 구성", "클래스 안내" 등 */
      label: string;
      mode: "item_price" | "item_consult";
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

// ---------- 블록 6: info ----------

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

export interface BusinessInfo {
  registered_name: string;
  ceo_name: string;
  registration_number: string;
}

export interface Info {
  address: string;
  map_coordinates: { lat: number; lng: number };
  /** 예약제 운영이면 "워크인 가능 시간"이 아니라 "상담·수업 가능 시간대"로 이해 */
  hours: Hours;
  phone: string;
  business_info: BusinessInfo | null;
  /**
   * 지하철역에 한정하지 않는 랜드마크 기반 도보 거리(2026-07-17 신규).
   * 예: "시청 사거리에서 도보 5분", "OO도서관 도보 3분". 접근성이 이 vertical의 핵심 신뢰
   * 요소 중 하나라 별도 강조 필드로 둔다 — 주소 문자열 안에 섞어 쓰지 않는다.
   */
  landmark_distance: string | null;
}
/**
 * `external_links` 필드는 2026-07-17 제거됨 — `meta.browse_channels`(둘러보기 채널)와 완전히 중복이었다.
 * 정보 블록 하단에 링크를 보여줄 땐 렌더러가 `meta.browse_channels`를 재사용한다(스킬이 두 번 판단할 이유가 없어짐).
 */

// ---------- 블록 7: sticky_cta ----------

export interface StickyCta {
  /** 저부담 문구만. 클릭 시 meta.inquiry_channels 다이얼로그가 열린다.
   *  general과 달리 버튼 1개로 단순화 — 둘러보기 채널은 이미 히어로에 노출되므로 여기서 반복하지 않는다. */
  cta_label: string;
}

// ---------- 블록 8: how_it_works (선택이나 사실상 권장) ----------

export interface HowItWorksStep {
  order: number;
  title: string;
  description: string;
}

export interface HowItWorks {
  /** 표준: 체험 있으면 "상담→체험→등록"(3단계), 없으면 "상담→등록"(2단계). 상담 생략 금지 */
  steps: HowItWorksStep[];
}

// ---------- 블록 9: faq (선택) ----------

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
  /** 이 vertical의 필수 블록 — general과 달리 null 불가 */
  professionals: Professionals;
  transformations: Transformations | null;
  reviews: Reviews | null;
  philosophy: Philosophy | null;
  gallery: Gallery | null;
  /** atmosphere_text 필드로 옛 atmosphere 블록을 흡수함(2026-07-17) */
  facility: Facility | null;
  menu: Menu;
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
