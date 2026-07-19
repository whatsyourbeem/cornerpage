/** info 블록(주소·전화)에서 결정적으로 유도하는 링크 — general의 cta.ts와 같은 원칙:
 * LLM이 준 값을 신뢰하지 않고 이미 확정된 phone/address에서 렌더러가 직접 계산한다. */
export function telHref(phone: string) {
  return `tel:${phone.replace(/[^0-9+]/g, "")}`;
}

export function naverMapHref(address: string) {
  return `https://map.naver.com/v5/search/${encodeURIComponent(address)}`;
}

/**
 * info.map_coordinates 위에 핀을 찍은 지도 임베드 URL. 네이버/카카오맵 SDK는 클라이언트
 * API 키 발급·설정이 필요해서(design-guide.md 8장 권장이지만 이 프로젝트엔 아직 없음),
 * 키 없이 바로 쓸 수 있는 OpenStreetMap 임베드로 우선 구현한다 — 핀 색상은 OSM 기본값
 * (렌더러가 --accent로 커스터마이징할 수 없음, 네이버/카카오 SDK 도입 시 교체 대상).
 */
export function osmEmbedSrc(lat: number, lng: number) {
  const delta = 0.006;
  const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join("%2C");
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`;
}
