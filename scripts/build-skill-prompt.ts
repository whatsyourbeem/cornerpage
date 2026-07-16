import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { VERTICALS } from "../src/lib/verticals";

// Structured Outputs가 content.schema.json의 규모/if-then을 처리하지 못해
// 포기했기 때문에(generate-content.ts 주석 참고), 프롬프트 텍스트가 Claude에게
// 출력 구조를 알려주는 유일한 수단이다. 사람이 읽는 원본 schema.md(완성 예시
// 포함)를 그대로 넣으면 토큰 비용이 크게 늘어나므로, 구조 정의만 남긴 축약본
// prompt-schema-summary.md를 대신 쓴다. schema.md의 구조 정의가 바뀌면 이
// 축약본도 반드시 함께 갱신해야 한다.
//
// vertical별로 콘텐츠 스키마 자체가 다르므로(spec/skill/README.md 1장·2장),
// SKILL.md + copywriting.md(공통) + 각 vertical의 blocks.md·
// prompt-schema-summary.md·industry-data.md를 vertical마다 따로 조합해
// SKILL_PROMPTS[vertical] 하나씩 만든다.
const COMMON_FILES = ["spec/skill/SKILL.md", "spec/skill/references/copywriting.md"];

function verticalFiles(vertical: string): string[] {
  const base = `spec/skill/references/verticals/${vertical}`;
  return [`${base}/blocks.md`, `${base}/prompt-schema-summary.md`, `${base}/industry-data.md`];
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
