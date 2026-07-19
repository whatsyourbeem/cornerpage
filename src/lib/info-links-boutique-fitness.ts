/** info 블록(주소·전화)에서 결정적으로 유도하는 링크 — general의 cta.ts와 같은 원칙:
 * LLM이 준 값을 신뢰하지 않고 이미 확정된 phone/address에서 렌더러가 직접 계산한다. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

export function naverMapHref(address: string) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(address)}`;
}
