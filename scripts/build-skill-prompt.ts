import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Structured Outputs가 content.schema.json의 규모/if-then을 처리하지 못해
// 포기했기 때문에(generate-content.ts 주석 참고), 프롬프트 텍스트가 Claude에게
// 출력 구조를 알려주는 유일한 수단이다. 사람이 읽는 원본 schema.md(6개 업종
// 완성 예시 포함, 24,787자)를 그대로 넣으면 토큰 비용이 크게 늘어나므로,
// 구조 정의만 남긴 축약본 prompt-schema-summary.md를 대신 쓴다. schema.md의
// 1~4장(구조 정의)이 바뀌면 이 축약본도 반드시 함께 갱신해야 한다.
const files = [
  "spec/skill/SKILL.md",
  "spec/skill/references/blocks.md",
  "spec/skill/references/copywriting.md",
  "spec/skill/references/general/industry-data.md",
  "spec/skill/references/prompt-schema-summary.md",
];

const combined = files
  .map((f) => readFileSync(join(process.cwd(), f), "utf-8"))
  .join("\n\n---\n\n");

const output = `// 자동 생성됨 — 직접 수정하지 말 것. scripts/build-skill-prompt.ts로 재생성.
export const SKILL_PROMPT = ${JSON.stringify(combined)};
`;

writeFileSync(join(process.cwd(), "src/lib/skill-prompt.generated.ts"), output);
console.log("skill-prompt.generated.ts 생성 완료");
