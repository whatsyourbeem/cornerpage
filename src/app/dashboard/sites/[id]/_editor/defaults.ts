import type {
  Facility,
  FaqItem,
  Gallery,
  HowItWorks,
  HowItWorksStep,
  InquiryChannel,
  MenuCategory,
  MenuItem,
  Philosophy,
  ProfessionalItem,
  Professionals,
  ReviewItem,
  Reviews,
  TransformationItem,
  Transformations,
} from "@/lib/content-types-boutique-fitness";

/**
 * 선택 블록을 "사용"으로 켰을 때 넣어줄 빈 골격, 그리고 목록에 항목을 추가할 때의
 * 초기값. 스키마의 minItems를 만족하는 최소 형태로 만든다 — 켜자마자 검증에
 * 걸리는 상태로 두면 사장님이 왜 저장이 안 되는지 알 수 없다. 대신 문자열은
 * 빈 값으로 두고(minLength 위반) 저장 전에 채우도록 화면에서 안내한다.
 */

export function createTransformationItem(): TransformationItem {
  return {
    before_after_image_url: "",
    duration_label: "",
    result_highlight: "",
    member_label: "",
    trainer_tag: null,
    description: null,
  };
}

export function createTransformations(): Transformations {
  return { items: [createTransformationItem()] };
}

export function createReviewItem(): ReviewItem {
  return { body: "", rating: null, author: "", source: null, trainer_tag: null };
}

export function createReviews(): Reviews {
  return { items: [createReviewItem()] };
}

export function createProfessionalItem(): ProfessionalItem {
  return {
    name: "",
    title: "",
    photo_url: null,
    certifications: [],
    specialty: "",
    years_experience: null,
    bio_quote: "",
  };
}

export function createProfessionals(): Professionals {
  return { section_label: "강사진 소개", items: [createProfessionalItem()] };
}

export function createPhilosophy(): Philosophy {
  return { text: "" };
}

export function createGallery(): Gallery {
  return { images: [], more_link_url: null };
}

export function createFacility(): Facility {
  return {
    size_pyeong: null,
    has_shower: null,
    has_locker: null,
    has_parking: null,
    equipment_list: null,
    photos: null,
    atmosphere_text: null,
  };
}

export function createMenuItem(): MenuItem {
  return { name: "", price: null, description: null, image_url: null, badge: null };
}

export function createMenuCategory(): MenuCategory {
  return { category_name: "", tiers: [{ label: "", price: "" }], representative_tier_index: 0 };
}

export function createHowItWorksStep(order: number): HowItWorksStep {
  return { order, title: "", description: "" };
}

/** 스키마상 2~4단계 — 켜자마자 minItems를 만족하도록 2단계로 시작한다. */
export function createHowItWorks(): HowItWorks {
  return { steps: [createHowItWorksStep(1), createHowItWorksStep(2)] };
}

export function createFaqItem(): FaqItem {
  return { question: "", answer: "" };
}

export function createFaq() {
  return { items: [createFaqItem()] };
}

export function createInquiryChannel(): InquiryChannel {
  return { type: "call", action_value: "", other_label: null };
}
