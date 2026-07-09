import type { CtaType, Info, StickyCtaButton } from "./content-types";

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
 * hero/topbar의 CTA는 {type,label}만 갖고 목적지가 없으므로,
 * info 블록의 실제 연락처/링크를 바탕으로 목적지를 추론한다.
 */
export function resolveCtaHref(type: CtaType, info: Info): string {
  switch (type) {
    case "call":
      return telHref(info.phone);
    case "reservation":
      return (
        findLink(info, "naver_reservation") ??
        findLink(info, "kakao") ??
        "#menu"
      );
    case "direction":
      return naverMapHref(info.address);
    case "dm":
      return findLink(info, "instagram") ?? "#info";
    default:
      return "#";
  }
}

/** sticky_cta 버튼은 action_value(전화번호 또는 URL/앵커)가 이미 정해져 있다 */
export function resolveStickyCtaHref(button: StickyCtaButton): string {
  if (button.type === "call") return telHref(button.action_value);
  return button.action_value;
}
