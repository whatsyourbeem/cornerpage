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
 * — boutique-fitness는 2026-07-19 렌더러(src/components/site-boutique-fitness/) 완성 및
 * 지음필라테스 실데이터 브라우저 검증까지 끝나서 게이트를 풀었다.
 */
export const RENDERER_READY_VERTICALS: readonly Vertical[] = ["general", "boutique-fitness"];
