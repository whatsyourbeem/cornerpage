/**
 * spec/schema/content.types.ts(단일 소스)를 그대로 재export한다. 렌더러 전역이
 * `@/lib/content-types`를 import 경로로 쓰고 있어서, 실제 타입 정의를 옮기는 대신
 * 이 파일을 얇은 재export 래퍼로 유지해 import 경로를 건드리지 않는다.
 */
export * from "../../spec/schema/content.types";
