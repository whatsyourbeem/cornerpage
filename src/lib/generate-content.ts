import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import Ajv2020 from "ajv/dist/2020";
import contentSchema from "../../skill/references/content.schema.json";
import { SKILL_PROMPT } from "./skill-prompt.generated";
import type {
  AxisATone,
  AxisBLayout,
  CtaPrimaryAction,
  MiniHomepageContent,
} from "./content-types";

/**
 * mini-homepage-builder 스킬(SKILL.md + references)을 시스템 프롬프트로 결합해
 * Claude API를 호출하는 실제 콘텐츠 생성기. mock-generate-content.ts를 대체한다.
 * 방법B(스킬 문서 텍스트 결합) 전략과 근거는 Notion "백엔드 API 아키텍처" 문서 2장 참고.
 *
 * axis_a_tone/axis_b_layout은 원래 스킬이 사업 정보로부터 스스로 판단해야 하는
 * 값이지만, 지금 이 answers는 목업 파이프라인 검증용 임시 폼(/create)에서 온
 * 값이라 톤/레이아웃을 사장님이 아니라 개발자가 테스트 목적으로 미리 골라
 * 넣는다. 그래서 이 값들은 스킬이 재판단하지 않고 그대로 쓰도록 프롬프트에
 * 명시한다 — 실제 질문형 입력 폼으로 교체되면 이 필드들도 다시 스킬 판단으로
 * 넘겨야 한다(README "다음 단계" 참고).
 *
 * Structured Outputs(output_config.format)는 쓰지 않는다 — 실측해보니 이
 * 스키마(11개 블록, 다수의 $defs, if/then 조건부 분기, minItems 등 배열 제약)가
 * Claude Structured Outputs가 지원하는 JSON Schema 범위를 넘어서 두 종류의 400을
 * 냈다: (1) minItems/maxItems가 0·1 이외면 거부, (2) if/then/else가 있으면 거부.
 * 이 둘을 스키마에서 벗겨내고 나니 이번엔 "compiled grammar is too large"로
 * 거부됐다 — 스키마 자체가 strict grammar 컴파일 한도를 넘는 규모. 그래서
 * Structured Outputs를 아예 포기하고, 프롬프트(SKILL_PROMPT에 포함된
 * prompt-schema-summary.md — schema.md의 축약본)로 구조를 지시한 뒤 ajv로 전체
 * 스키마(content.schema.json, if/then 포함)를 최종 검증하는 방식으로 바꿨다 —
 * 애초에 기술 문서 6장이 "이중 안전망"이라 부른 ajv 쪽이 사실상 유일한 강제
 * 수단이 된 것.
 *
 * ajv는 plain `Ajv`가 아니라 `ajv/dist/2020`(Ajv2020)을 써야 한다 —
 * content.schema.json이 "$schema": ".../2020-12/schema"를 선언하는데, plain
 * Ajv(draft-07 기본)로 컴파일하면 "no schema with key or ref
 * .../2020-12/schema" 에러가 난다(실측 확인). Notion 문서 6장의 예시 코드가
 * plain Ajv를 쓰고 있는데 이건 이 스키마에서는 실제로 동작하지 않는다.
 */

export interface DraftAnswers {
  business_name: string;
  industry_category: string;
  axis_a_tone: AxisATone;
  axis_b_layout: AxisBLayout;
  cta_primary_action: CtaPrimaryAction;
  badge: string;
  headline: string;
  tagline: string;
  phone: string;
  address: string;
  menu_label: string;
  menu_items: {
    name: string;
    price: string;
    description: string;
    image_url: string | null;
  }[];
  trust_strip_items: [
    { value: string; label: string },
    { value: string; label: string },
    { value: string; label: string },
  ];
  logo_url: string | null;
  hero_image_url: string | null;
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ajv = new Ajv2020({ strict: false });
const validateContent = ajv.compile(contentSchema);

function extractText(message: Anthropic.Message): string {
  for (const block of message.content) {
    if (block.type === "text") return block.text;
  }
  throw new Error("Claude 응답에 텍스트 블록이 없음");
}

/** 코드펜스(```json ... ```)로 감싸서 응답하는 경우를 대비한 방어적 파싱. */
function stripCodeFence(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return fenced ? fenced[1] : text;
}

async function attemptGenerate(answers: DraftAnswers): Promise<MiniHomepageContent> {
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    system: SKILL_PROMPT,
    messages: [
      {
        role: "user",
        content:
          "다음은 사업 정보 답변이다. axis_a_tone과 axis_b_layout은 이미 정해져 있으니 " +
          "그대로 사용하고, 나머지 블록의 온오프·순서·카피는 스킬 지침에 따라 판단해줘. " +
          "출력은 콘텐츠 JSON 하나만 — 다른 설명 문구나 마크다운 코드펜스 없이 순수 " +
          `JSON만 응답해.\n\n${JSON.stringify(answers, null, 2)}`,
      },
    ],
  });

  const content = JSON.parse(stripCodeFence(extractText(response)));

  if (!validateContent(content)) {
    throw new Error(`콘텐츠 스키마 검증 실패: ${ajv.errorsText(validateContent.errors)}`);
  }

  return content as unknown as MiniHomepageContent;
}

/** 네트워크 오류·레이트리밋·스키마 검증 실패 모두 1회 재시도 후 포기한다(데이터 지어내기 금지). */
export async function generateContent(answers: DraftAnswers): Promise<MiniHomepageContent> {
  try {
    return await attemptGenerate(answers);
  } catch (err) {
    console.error("콘텐츠 생성 실패, 1회 재시도:", err);
    return await attemptGenerate(answers);
  }
}
