/**
 * ajv 에러의 instancePath("/blocks/hero/headline")를 사장님이 읽을 수 있는
 * 한국어 위치("히어로 · 헤드라인")로 바꾼다. ajv errorsText 원문은 영어 JSON
 * 경로라 편집 화면에 그대로 띄울 수 없다.
 *
 * boutique-fitness 기준으로 만들었지만 general과 겹치는 필드명이 대부분이라
 * 그대로 공유한다 — 없는 키는 원문을 그대로 쓰므로 잘못 매핑되지 않는다.
 */

const BLOCK_LABELS: Record<string, string> = {
  topbar: "상단바",
  hero: "히어로",
  trust_strip: "신뢰 지표",
  transformations: "변화 사례",
  reviews: "후기",
  professionals: "강사진",
  philosophy: "철학",
  gallery: "갤러리",
  facility: "시설",
  menu: "프로그램",
  info: "매장 정보",
  sticky_cta: "하단 버튼",
  how_it_works: "이용 안내",
  faq: "자주 묻는 질문",
};

const FIELD_LABELS: Record<string, string> = {
  // meta
  business_name: "상호",
  industry_category: "업종",
  lead_emphasis: "가장 내세울 항목",
  inquiry_channels: "문의 채널",
  browse_channels: "둘러보기 채널",
  logo_url: "로고",
  brand_color: "브랜드 컬러",
  // 채널 공통
  type: "유형",
  action_value: "연결 값",
  other_label: "기타 이름",
  // topbar · hero · sticky_cta
  display_name: "표시 이름",
  cta_label: "버튼 문구",
  badge: "배지",
  headline: "헤드라인",
  tagline: "한 줄 설명",
  background_images: "배경 사진",
  // trust_strip
  value: "값",
  label: "이름",
  icon: "아이콘",
  // transformations
  before_after_image_url: "비포·애프터 사진",
  duration_label: "기간",
  result_highlight: "변화 요약",
  member_label: "회원 표기",
  trainer_tag: "담당 강사",
  // reviews
  body: "내용",
  rating: "별점",
  author: "작성자",
  source: "출처",
  // professionals
  section_label: "섹션 제목",
  name: "이름",
  title: "직함",
  photo_url: "사진",
  certifications: "자격·이력",
  specialty: "전문 분야",
  years_experience: "경력",
  bio_quote: "한 줄 소개",
  // philosophy · facility
  text: "내용",
  size_pyeong: "규모(평)",
  has_shower: "샤워실",
  has_locker: "락커",
  has_parking: "주차",
  equipment_list: "장비",
  photos: "사진",
  atmosphere_text: "분위기 설명",
  // gallery
  images: "사진",
  more_link_url: "더보기 링크",
  // menu
  mode: "표시 방식",
  items: "항목",
  categories: "카테고리",
  category_name: "카테고리 이름",
  tiers: "가격 단계",
  representative_tier_index: "대표 가격 단계",
  full_list_link_enabled: "전체 목록 링크",
  price: "가격",
  description: "설명",
  image_url: "사진",
  // info
  address: "주소",
  map_coordinates: "지도 좌표",
  hours: "영업시간",
  structured: "요일별 시간",
  day: "요일",
  open: "여는 시간",
  close: "닫는 시간",
  break: "브레이크타임",
  last_order: "라스트오더",
  closed: "휴무",
  phone: "전화번호",
  business_info: "사업자 정보",
  registered_name: "상호(사업자)",
  ceo_name: "대표자",
  registration_number: "사업자등록번호",
  landmark_distance: "찾아오는 길",
  // how_it_works · faq
  steps: "단계",
  order: "순서",
  question: "질문",
  answer: "답변",
};

/**
 * "/blocks/professionals/items/0/name" → "강사진 · 1번째 항목 · 이름"
 * 빈 경로(문서 루트)는 "전체"로 표시한다.
 */
export function describeContentPath(instancePath: string): string {
  const segments = instancePath.split("/").filter(Boolean);
  if (segments.length === 0) return "전체";

  const parts: string[] = [];
  segments.forEach((segment, index) => {
    if (/^\d+$/.test(segment)) {
      parts.push(`${Number(segment) + 1}번째`);
      return;
    }
    // "meta"·"blocks"는 그 자체로는 사장님에게 의미가 없다 — blocks 다음에 오는
    // 블록 이름이 실질적인 위치 표시라서 그 한 겹만 블록 라벨로 바꾼다.
    if (index === 0 && (segment === "meta" || segment === "blocks")) {
      if (segment === "meta") parts.push("기본 정보");
      return;
    }
    if (index === 1 && segments[0] === "blocks" && BLOCK_LABELS[segment]) {
      parts.push(BLOCK_LABELS[segment]);
      return;
    }
    parts.push(FIELD_LABELS[segment] ?? segment);
  });

  return parts.join(" · ");
}
