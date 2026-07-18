/**
 * spec/for-claude-api/ 하위 vertical 폴더 목록과 1:1 대응하는 단일 소스.
 * scripts/build-skill-prompt.ts(스킬 프롬프트 조립)와 generate-content.ts(스키마 검증
 * 선택)가 둘 다 이 목록을 기준으로 vertical별 파일을 읽는다 — 새 vertical을 추가하면
 * spec/ 아래 폴더뿐 아니라 이 배열도 함께 갱신해야 한다.
 */
export const VERTICALS = ["general", "boutique-fitness"] as const;
export type Vertical = (typeof VERTICALS)[number];

/**
 * 렌더러(MiniHomepageSite.tsx 등)가 실제로 그릴 수 있는 vertical 목록. 스키마/
 * 프롬프트가 완성돼도 렌더러가 그 블록 구성을 지원해야 실제로 생성을 열 수 있다
 * — boutique-fitness는 schema/prompt가 2026-07-18 기준 완성됐지만, meta에
 * axis_a_tone/axis_b_layout이 없고(LAYOUT_ORDER[undefined]로 렌더러가
 * 크래시함) professionals/transformations/facility 블록 컴포넌트도 아직 없어서
 * 여기 추가하지 않는다. 렌더러 작업이 끝나면 이 배열에 추가하는 것만으로
 * generateContent()의 게이트가 풀린다.
 */
export const RENDERER_READY_VERTICALS: readonly Vertical[] = ["general"];

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
 * 한다(spec/README.md 3장). boutique-fitness의 콘텐츠 스키마가 이제 실제로
 * general과 크게 갈라져 있어서(신규 블록 3종, meta 구조 변경 등) 이 판별 정확도가
 * 그대로 결과 품질에 영향을 준다 — 지금은 키워드 매칭 수준이고, 정교화는 별도 작업.
 */
export function determineVertical(industryCategory: string): Vertical {
  const normalized = industryCategory.replace(/\s/g, "");
  const isBoutiqueFitness = BOUTIQUE_FITNESS_KEYWORDS.some((kw) =>
    normalized.includes(kw.replace(/\s/g, ""))
  );
  return isBoutiqueFitness ? "boutique-fitness" : "general";
}
