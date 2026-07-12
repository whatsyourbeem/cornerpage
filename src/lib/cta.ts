import type { CtaType, Info } from "./content-types";

function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

function findLink(info: Info, platform: string) {
  return info.external_links.find((l) => l.platform === platform)?.url;
}

function naverMapHref(address: string) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(address)}`;
}

/**
 * 모든 CTA 버튼(topbar.action_button, hero.cta, sticky_cta.buttons)의 href를
 * 여기서 결정적으로 계산한다. LLM이 준 값(sticky_cta.buttons[].action_value 등)은
 * 신뢰하지 않는다 — 실측상 "02-333-4455"처럼 tel: 접두사 없는 전화번호나, 지도 URL
 * 대신 주소 원문 텍스트를 그대로 채워 넣는 경우가 있었다. map_coordinates·이미지
 * URL과 같은 원칙: 이미 확정된 값(info.phone/address/external_links)에서 렌더러가
 * 직접 유도할 수 있는 값은 LLM의 추측에 맡기지 않는다.
 */
export function resolveCtaHref(type: CtaType, info: Info): string {
  switch (type) {
    case "call":
      return telHref(info.phone);
    case "reservation":
      // 온라인 예약 링크가 없으면 전화가 항상 가능한 최종 폴백이다(phone은 필수
      // 필드). "#menu"로 스크롤만 시키면 라벨("전화로 예약하기")과 실제 동작이
      // 어긋난다.
      return (
        findLink(info, "naver_reservation") ??
        findLink(info, "kakao") ??
        telHref(info.phone)
      );
    case "direction":
      return naverMapHref(info.address);
    case "dm":
      return findLink(info, "instagram") ?? "#info";
    default:
      return "#";
  }
}
