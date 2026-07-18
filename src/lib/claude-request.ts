import "server-only";
import { SKILL_PROMPTS } from "./skill-prompt.generated";
import type { Vertical } from "./verticals";

export interface ClaudeRequestBody {
  model: "claude-sonnet-5";
  max_tokens: number;
  system: string;
  messages: { role: "user"; content: string }[];
}

/**
 * 실제로 Claude API에 보내는 요청 본문을 만드는 유일한 지점. 자동 파이프라인
 * (generate-content.ts의 attemptGenerate)과 수동 테스트 흐름(POST
 * /api/sites/request-body — 사장님 답변만 채워지면 클로드 API 호출 없이 이
 * 본문을 화면에 보여주고, 사람이 직접 claude.ai에 붙여넣어 받은 응답을 다시
 * 붙여넣게 하는 임시 경로, generate-content.ts 주석 참고)가 이 함수 하나를
 * 공유한다 — 화면에 보여주는 요청 본문이 실제 자동 호출 시 나가는 것과 한 글자도
 * 다르지 않도록 보장하기 위해서다.
 */
export function buildClaudeRequestBody(vertical: Vertical, answers: unknown): ClaudeRequestBody {
  return {
    model: "claude-sonnet-5",
    max_tokens: 8192,
    system: SKILL_PROMPTS[vertical],
    messages: [
      {
        role: "user",
        content:
          "다음은 사장님이 입력한 사업 정보(가공 전 원본)다. meta의 판단 필드부터 " +
          "각 블록의 온오프·순서·카피까지 전부 스킬 지침에 따라 " +
          "직접 판단해서 콘텐츠 JSON을 생성해줘. 출력은 콘텐츠 JSON 하나만 — 다른 " +
          `설명 문구나 마크다운 코드펜스 없이 순수 JSON만 응답해.\n\n${JSON.stringify(answers, null, 2)}`,
      },
    ],
  };
}
