/**
 * spec/schema/general/content.types.ts(단일 소스)를 그대로 재export한다. 렌더러
 * 전역이 `@/lib/content-types`를 import 경로로 쓰고 있어서, 실제 타입 정의를
 * 옮기는 대신 이 파일을 얇은 재export 래퍼로 유지해 import 경로를 건드리지 않는다.
 *
 * general 고정: 렌더러(컴포넌트 트리)는 아직 vertical별로 분기하지 않고 general
 * 스키마 하나만 그린다 — DB도 아직 단일 sites.content_json 테이블이라 실제로
 * general 콘텐츠만 저장된다. boutique-fitness 스키마가 실제로 갈라지고 렌더러도
 * vertical별로 분기하게 되면 이 파일도 vertical-aware하게 다시 손봐야 한다.
 */
export * from "../../spec/schema/general/content.types";
