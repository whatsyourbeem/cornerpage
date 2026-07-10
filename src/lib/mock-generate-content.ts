import type {
  AxisATone,
  AxisBLayout,
  CtaPrimaryAction,
  MiniHomepageContent,
} from "./content-types";

/**
 * 임시 목업 생성기. 실제로는 이 자리에서 mini-homepage-builder 스킬(LLM)이
 * 텍스트 답변만 받아서 카피·블록 온오프·톤을 판단해야 한다. 지금은 백엔드
 * 파이프라인(업로드 → API → DB → 렌더링)을 먼저 검증하기 위한 자리채움이라,
 * 창작 없이 폼 입력을 스키마 모양대로 옮겨 담기만 한다.
 *
 * 이미지 URL(hero/logo/menu)은 스킬이 손대는 부분이 아니라 API가 그대로
 * 대입하는 값이라는 원칙은 실제 생성기로 바뀌어도 동일하게 유지된다.
 */

export interface DraftAnswers {
  business_name: string;
  industry_category: string;
  axis_a_tone: AxisATone;
  axis_b_layout: AxisBLayout;
  cta_primary_action: CtaPrimaryAction;
  badge: string;
  headline: string;
  tagline: string;
  phone: string;
  address: string;
  menu_label: string;
  menu_items: {
    name: string;
    price: string;
    description: string;
    image_url: string | null;
  }[];
  trust_strip_items: [
    { value: string; label: string },
    { value: string; label: string },
    { value: string; label: string },
  ];
  logo_url: string | null;
  hero_image_url: string | null;
}

const CTA_LABEL: Record<CtaPrimaryAction, string> = {
  call: "전화하기",
  reservation: "예약하기",
  direction: "오시는 길",
};

export function buildMockContent(answers: DraftAnswers): MiniHomepageContent {
  const cta = { type: answers.cta_primary_action, label: CTA_LABEL[answers.cta_primary_action] };

  return {
    meta: {
      business_name: answers.business_name,
      industry_category: answers.industry_category,
      axis_a_tone: answers.axis_a_tone,
      axis_b_layout: answers.axis_b_layout,
      cta_primary_action: answers.cta_primary_action,
      cta_interaction_mode: "functional",
      logo_url: answers.logo_url,
      brand_color: null,
    },
    blocks: {
      topbar: {
        display_name: answers.business_name,
        action_button: cta,
      },
      hero: {
        badge: answers.badge,
        headline: answers.headline,
        tagline: answers.tagline,
        background_image_url: answers.hero_image_url,
        cta,
      },
      trust_strip: { items: answers.trust_strip_items },
      about: null,
      menu: {
        label: answers.menu_label,
        mode: "item_price",
        items: answers.menu_items.map((item) => ({
          name: item.name,
          price: item.price || null,
          description: item.description || null,
          image_url: item.image_url,
          badge: null,
        })),
        categories: null,
        full_list_link_enabled: false,
      },
      gallery: null,
      reviews: null,
      info: {
        address: answers.address,
        map_coordinates: { lat: 0, lng: 0 },
        hours: { type: "24h", structured: null },
        phone: answers.phone,
        external_links: [],
        business_info: null,
      },
      sticky_cta: {
        buttons: [
          {
            type: answers.cta_primary_action,
            label: CTA_LABEL[answers.cta_primary_action],
            action_value:
              answers.cta_primary_action === "call" ? answers.phone : "#info",
          },
        ],
      },
      how_it_works: null,
      faq: null,
    },
  };
}
