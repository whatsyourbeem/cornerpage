import "server-only";

/**
 * 주소 → 위경도 변환. OpenStreetMap Nominatim(무료, 키 불필요)을 쓴다.
 *
 * map_coordinates는 지금 렌더러 어디에서도 쓰이지 않는다(길찾기 CTA는
 * info.address 문자열로 네이버맵 검색 링크를 만든다 — src/lib/cta.ts 참고).
 * 그런데도 content.schema.json은 이 필드를 필수 숫자 객체로 요구해서,
 * Claude가 주소 텍스트만 보고 좌표를 추측하게 하면 실측상 자주(테스트 4회 중
 * 3회) 스키마 검증에 실패했다. 그래서 brand_color·이미지 URL과 같은 원칙으로
 * 백엔드가 결정적으로 값을 채워 넣는다 — Claude의 추측에 맡기지 않는다.
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "cornerpage/0.1 (https://cornerpage.co)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { lat: 0, lng: 0 };

    const results = (await res.json()) as { lat: string; lon: string }[];
    if (!results.length) return { lat: 0, lng: 0 };

    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
  } catch (err) {
    console.error("지오코딩 실패:", err);
    return { lat: 0, lng: 0 };
  }
}
