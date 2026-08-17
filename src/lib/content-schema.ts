import "server-only";
import Ajv2020 from "ajv/dist/2020";
import type { ErrorObject } from "ajv";
import contentSchemaGeneral from "../../spec/for-frontend/general/content.schema.json";
import contentSchemaBoutiqueFitness from "../../spec/for-frontend/boutique-fitness/content.schema.json";
import type { Vertical } from "./verticals";

/**
 * content.schema.json(vertical별) ajv 검증기. 생성 경로(generate-content.ts —
 * Claude 응답 검증)와 편집 경로(PATCH /api/sites/[id]/content — 사장님이 고친
 * content_json 검증)가 이 한 벌을 공유한다. 두 경로가 서로 다른 규칙으로 저장하면
 * 편집기로 저장한 사이트가 렌더러 계약을 깨뜨릴 수 있어서, 검증은 반드시 한 곳에만 둔다.
 *
 * generate-content.ts에 있던 것을 그대로 옮겼다 — 거기 두면 편집 API 라우트가
 * 검증기 하나 쓰자고 Anthropic 클라이언트까지 통째로 끌고 들어온다.
 *
 * ajv는 plain `Ajv`가 아니라 `ajv/dist/2020`(Ajv2020)을 써야 한다 —
 * content.schema.json이 "$schema": ".../2020-12/schema"를 선언하는데, plain
 * Ajv(draft-07 기본)로 컴파일하면 "no schema with key or ref
 * .../2020-12/schema" 에러가 난다(실측 확인).
 *
 * vertical마다 독립된 Ajv 인스턴스를 쓴다 — 두 스키마의 $id가 같아서(현재 동일
 * 복사본) 하나의 Ajv 인스턴스에 둘 다 compile하면 "schema with key already
 * exists" 충돌이 난다. errorsText도 컴파일에 쓴 인스턴스로 호출해야 하므로
 * validate와 ajv를 한 쌍으로 묶어 보관한다.
 *
 * client 번들에 들어가면 ajv + 스키마 JSON 두 벌이 통째로 딸려가므로 server-only로
 * 막아둔다. 편집기 UI가 입력 단계에서 강제해야 하는 개수·길이 제약은 이 파일이 아니라
 * 별도 상수로 공유한다.
 */

function buildValidator(schema: object) {
  const ajv = new Ajv2020({ strict: false });
  return { ajv, validate: ajv.compile(schema) };
}

const validators: Record<Vertical, ReturnType<typeof buildValidator>> = {
  general: buildValidator(contentSchemaGeneral),
  "boutique-fitness": buildValidator(contentSchemaBoutiqueFitness),
};

/**
 * 검증 통과면 null, 실패면 ajv 에러 배열을 그대로 돌려준다 — 호출부가 instancePath로
 * "어느 필드가 틀렸는지"를 사장님용 한국어 메시지로 매핑할 수 있어야 해서, 문자열로
 * 뭉개지 않고 구조를 유지한다.
 *
 * ajv는 validate() 호출마다 errors 배열을 새로 할당하므로(같은 배열을 재사용하지
 * 않는다) 여기서 꺼낸 참조는 다음 검증에 덮어써지지 않는다 — 모듈 레벨 validator를
 * 여러 요청이 공유해도 안전하다.
 */
export function validateContent(vertical: Vertical, content: unknown): ErrorObject[] | null {
  const { validate } = validators[vertical];
  if (validate(content)) return null;
  return validate.errors ?? [];
}

/**
 * ajv 에러 → 한 줄 요약 문자열. 사장님에게 그대로 보여줄 형태가 아니다 —
 * Claude repair loop 재요청 메시지와 관리자 알림·서버 로그 용도다.
 */
export function formatValidationErrors(vertical: Vertical, errors: ErrorObject[]): string {
  return validators[vertical].ajv.errorsText(errors);
}
