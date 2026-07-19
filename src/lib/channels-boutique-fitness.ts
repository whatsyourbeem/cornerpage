import type { BrowseChannel, InquiryChannel } from "./content-types-boutique-fitness";

/**
 * 채널별 고정 라벨 템플릿 — design-guide.md 4-1장: "LLM이 채널별 버튼 문구를 새로 쓰지
 * 않는다, 프론트엔드가 type만 보고 고정 템플릿으로 렌더링". LLM이 준 값은 action_value뿐이다.
 */
const INQUIRY_LABEL: Record<Exclude<InquiryChannel["type"], "other">, string> = {
  call: "전화 문의",
  kakao: "카카오톡으로 문의",
  naver_reservation: "네이버예약",
  instagram_dm: "인스타그램 DM",
};

const BROWSE_LABEL: Record<Exclude<BrowseChannel["type"], "other">, string> = {
  kakao: "카카오톡",
  naver_blog: "네이버블로그",
  instagram: "인스타그램",
  youtube: "유튜브",
  naver_map: "네이버지도",
};

export function inquiryChannelLabel(channel: InquiryChannel): string {
  return channel.type === "other" ? channel.other_label : INQUIRY_LABEL[channel.type];
}

export function browseChannelLabel(channel: BrowseChannel): string {
  return channel.type === "other" ? channel.other_label : BROWSE_LABEL[channel.type];
}

function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

/** call만 tel: 링크로 변환 — 나머지 타입은 action_value가 이미 완전한 URL이라 그대로 쓴다. */
export function inquiryChannelHref(channel: InquiryChannel): string {
  return channel.type === "call" ? telHref(channel.action_value) : channel.action_value;
}

export function browseChannelHref(channel: BrowseChannel): string {
  return channel.action_value;
}
