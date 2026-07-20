import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { VERTICALS } from "../src/lib/verticals";
import { findUnlabeledFields } from "./audit-required-nullable";

// 2층(빌드 타임 lint, spec/README.md 7장 "Claude Code 요청사항"): required-but-nullable
// 필드가 schema-summary.md에 "required key"로 라벨 안 돼 있으면 빌드를 막는다 — 이 라벨이
// 빠지면 LLM이 "값이 없으니 키도 생략해도 되겠지"로 착각해 ajv 검증 실패로 이어진다
// (실제 발생 사례: 2026-07-18, boutique-fitness의 info.hours.structured[].break·last_order 누락).
// 원본 감사 로직은 spec/tools/audit_required_nullable.py, 이건 그 Node 포팅.
for (const vertical of VERTICALS) {
  const schemaPath = join(process.cwd(), `spec/for-frontend/${vertical}/content.schema.json`);
  const summaryPath = join(process.cwd(), `spec/for-claude-api/${vertical}/schema-summary.md`);
  const unlabeled = findUnlabeledFields(schemaPath, summaryPath);
  if (unlabeled.length > 0) {
    console.error(`\n[audit-required-nullable] ${vertical}: schema-summary.md에 "required key" 라벨이 빠진 필드 ${unlabeled.length}개:`);
    for (const field of unlabeled) console.error(`  - ${field}`);
    console.error(`\nspec/for-claude-api/${vertical}/schema-summary.md에서 해당 필드 옆에 "required key"를 추가하세요.\n`);
    process.exit(1);
  }
}

// Structured Outputs가 content.schema.json의 규모/if-then을 처리하지 못해
// 포기했기 때문에(generate-content.ts 주석 참고), 프롬프트 텍스트가 Claude에게
// 출력 구조를 알려주는 유일한 수단이다. schema-summary.md(완성 예시를 뺀 구조
// 정의만)가 이 역할을 한다 — 완성 예시가 필요하면 spec/for-frontend/fixtures/{vertical}/를
// 직접 본다(2026-07-16 이전엔 schema.md가 예시를 따로 들고 있었는데 fixtures와
// byte-for-byte 중복이라 폐기됨).
//
// blocks.md는 for-claude-api/에서 빠졌다(2026-07-18) — 실질 지침이 이미
// schema-summary.md의 필드별 인라인 주석에 압축돼 있다는 게 확인되어
// for-context/{vertical}/blocks.md(설계 근거 문서, API 미전송)로 옮겨졌다.
// 그래서 vertical당 프롬프트에 실리는 파일이 3개→2개로 줄었다.
//
// spec/for-claude-api/ 밑은 "여기 있는 파일 = 통째로 API로 보내도 되는 파일"이
// 되도록 설계되어 있다(spec/README.md 1장) — vertical별로 콘텐츠 스키마 자체가
// 다르므로, SKILL.md + copywriting.md(공통) + 각 vertical의 schema-summary.md·
// industry-data.md를 vertical마다 따로 조합해 SKILL_PROMPTS[vertical] 하나씩
// 만든다.
const COMMON_FILES = ["spec/for-claude-api/SKILL.md", "spec/for-claude-api/copywriting.md"];

function verticalFiles(vertical: string): string[] {
  const base = `spec/for-claude-api/${vertical}`;
  return [`${base}/schema-summary.md`, `${base}/industry-data.md`];
}

function readAll(files: string[]): string {
  return files
    .map((f) => readFileSync(join(process.cwd(), f), "utf-8"))
    .join("\n\n---\n\n");
}

const entries = VERTICALS.map((vertical) => {
  const combined = readAll([...COMMON_FILES, ...verticalFiles(vertical)]);
  return `  "${vertical}": ${JSON.stringify(combined)},`;
});

const output = `// 자동 생성됨 — 직접 수정하지 말 것. scripts/build-skill-prompt.ts로 재생성.
import type { Vertical } from "./verticals";

export const SKILL_PROMPTS: Record<Vertical, string> = {
${entries.join("\n")}
};
`;

writeFileSync(join(process.cwd(), "src/lib/skill-prompt.generated.ts"), output);
console.log(`skill-prompt.generated.ts 생성 완료 (${VERTICALS.join(", ")})`);
