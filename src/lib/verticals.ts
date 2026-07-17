/**
 * spec/for-claude-api/ 하위 vertical 폴더 목록과 1:1 대응하는 단일 소스.
 * scripts/build-skill-prompt.ts(스킬 프롬프트 조립)와 generate-content.ts(스키마 검증
 * 선택)가 둘 다 이 목록을 기준으로 vertical별 파일을 읽는다 — 새 vertical을 추가하면
 * spec/ 아래 폴더뿐 아니라 이 배열도 함께 갱신해야 한다.
 */
export const VERTICALS = ["general", "boutique-fitness"] as const;
export type Vertical = (typeof VERTICALS)[number];

// boutique-fitness = PT·필라테스·요가 등 1:1/소수정예 트레이너 주도형 스튜디오
// (spec/README.md 3장). 대형 회원제 헬스장("헬스장"·"피트니스센터" 등)은
// 의도적으로 제외 — 매칭 안 되면 general로 떨어진다.
const BOUTIQUE_FITNESS_KEYWORDS = [
  "필라테스",
  "요가",
  "퍼스널트레이닝",
  "퍼스널 트레이닝",
  "PT샵",
  "PT스튜디오",
  "PT 스튜디오",
];

/**
 * vertical 라우팅 — LLM이 실행 중에 고르지 않고, 요청 전에 백엔드가 미리 결정해야
 * 한다(spec/README.md 3장). 현재 general/boutique-fitness의 실제 콘텐츠
 * 스키마가 동일 복사본이라 오분류의 실질적 영향은 없지만, boutique-fitness가
 * 실제로 갈라지면 이 판별 정확도가 그대로 결과 품질에 영향을 준다 — 지금은
 * 키워드 매칭 수준이고, 정교화는 별도 작업.
 */
export function determineVertical(industryCategory: string): Vertical {
  const normalized = industryCategory.replace(/\s/g, "");
  const isBoutiqueFitness = BOUTIQUE_FITNESS_KEYWORDS.some((kw) =>
    normalized.includes(kw.replace(/\s/g, ""))
  );
  return isBoutiqueFitness ? "boutique-fitness" : "general";
}
