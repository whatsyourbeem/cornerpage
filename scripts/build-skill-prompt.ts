import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { VERTICALS } from "../src/lib/verticals";

// Structured Outputs가 content.schema.json의 규모/if-then을 처리하지 못해
// 포기했기 때문에(generate-content.ts 주석 참고), 프롬프트 텍스트가 Claude에게
// 출력 구조를 알려주는 유일한 수단이다. schema-summary.md(완성 예시를 뺀 구조
// 정의만)가 이 역할을 한다 — 완성 예시가 필요하면 spec/for-frontend/fixtures/{vertical}/를
// 직접 본다(2026-07-16 이전엔 schema.md가 예시를 따로 들고 있었는데 fixtures와
// byte-for-byte 중복이라 폐기됨).
//
// spec/for-claude-api/ 밑은 "여기 있는 파일 = 통째로 API로 보내도 되는 파일"이
// 되도록 설계되어 있다(spec/README.md 1장) — vertical별로 콘텐츠 스키마 자체가
// 다르므로, SKILL.md + copywriting.md(공통) + 각 vertical의 blocks.md·
// schema-summary.md·industry-data.md를 vertical마다 따로 조합해
// SKILL_PROMPTS[vertical] 하나씩 만든다.
const COMMON_FILES = ["spec/for-claude-api/SKILL.md", "spec/for-claude-api/copywriting.md"];

function verticalFiles(vertical: string): string[] {
  const base = `spec/for-claude-api/${vertical}`;
  return [`${base}/blocks.md`, `${base}/schema-summary.md`, `${base}/industry-data.md`];
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
