import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import Ajv2020 from "ajv/dist/2020";
import contentSchema from "../../skill/references/content.schema.json";
import { geocodeAddress } from "./geocode";
import { SKILL_PROMPT } from "./skill-prompt.generated";
import type {
  CtaPrimaryAction,
  CtaInteractionMode,
  DayOfWeek,
  ExternalLinkPlatform,
  MiniHomepageContent,
} from "./content-types";

/**
 * mini-homepage-builder 스킬(SKILL.md + references)을 시스템 프롬프트로 결합해
 * Claude API를 호출하는 실제 콘텐츠 생성기. mock-generate-content.ts를 대체한다.
 * 방법B(스킬 문서 텍스트 결합) 전략과 근거는 Notion "백엔드 API 아키텍처" 문서 2장 참고.
 *
 * DraftAnswers는 skill/references/input-questions.md의 질문 흐름을 그대로 따르는
 * "가공 전 사업 정보"다. axis_a_tone/axis_b_layout/cta 유형·카피(headline 등)를
 * 프론트가 미리 정해서 넘기던 이전 목업 파이프라인 방식(placeholder /create 폼)과
 * 달리, 이제는 업종·강점·메뉴 같은 원재료만 넘기고 톤/레이아웃 판단과 카피 작성은
 * 전부 스킬이 SKILL.md 지침대로 직접 한다 — 이게 원래 스킬 설계였다.
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

export interface DraftHoursEntry {
  day: DayOfWeek;
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface DraftAnswers {
  // STEP 1 — 업종 (분기점)
  industry_category: string;

  // STEP 2 — 기본 정보 (필수)
  business_name: string;
  address: string;
  phone: string;
  hours: { type: "24h" } | { type: "structured"; structured: DraftHoursEntry[] };
  hero_image_url: string | null;
  logo_url: string | null;
  cta_primary_action: CtaPrimaryAction;

  // STEP 3 — 강점·소개 (선택)
  intro: string | null;
  strengths: string[];

  // STEP 4 — 메뉴/서비스·사진 (필수)
  menu_items: { name: string; price: string | null }[];
  gallery_image_urls: string[];

  // STEP 5 — 신뢰·링크 (선택)
  external_links: { platform: ExternalLinkPlatform; url: string }[];
  reviews: { body: string; author: string; rating: number | null }[];
  cta_interaction_mode: CtaInteractionMode;

  // 신규 블록 문항 (선택)
  how_it_works_note: string | null;
  faq_answers: { question: string; answer: string }[];
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

async function attemptGenerate(
  answers: DraftAnswers,
  coordinates: { lat: number; lng: number }
): Promise<MiniHomepageContent> {
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    system: SKILL_PROMPT,
    messages: [
      {
        role: "user",
        content:
          "다음은 사장님이 입력한 사업 정보(가공 전 원본)다. axis_a_tone·axis_b_layout " +
          "같은 판단 필드부터 각 블록의 온오프·순서·카피까지 전부 스킬 지침에 따라 " +
          "직접 판단해서 콘텐츠 JSON을 생성해줘. 출력은 콘텐츠 JSON 하나만 — 다른 " +
          `설명 문구나 마크다운 코드펜스 없이 순수 JSON만 응답해.\n\n${JSON.stringify(answers, null, 2)}`,
      },
    ],
  });

  const content = JSON.parse(stripCodeFence(extractText(response))) as {
    blocks?: {
      info?: {
        map_coordinates?: unknown;
        hours?: { type: string; structured?: Record<string, unknown>[] | null };
      };
    };
  };

  // map_coordinates는 이미지 URL·brand_color와 같은 패스스루 필드다 — Claude가
  // 주소 텍스트만 보고 추측하게 두지 않고 백엔드가 지오코딩한 값으로 항상
  // 덮어쓴다(geocode.ts 주석 참고). ajv 검증보다 먼저 해야 검증 실패도 막는다.
  if (content.blocks?.info) {
    content.blocks.info.map_coordinates = coordinates;
  }

  // content.schema.json은 HoursStructuredEntry의 break/last_order를 "필수 키지만
  // null 가능"으로 정의하는데(값이 없으면 null, 키 자체를 생략하면 안 됨), Claude가
  // 브레이크타임·라스트오더가 없을 때 null을 명시하는 대신 키 자체를 자주
  // 빠뜨린다(실측상 가장 흔한 검증 실패 원인). 의미상 "없음"이 확실하므로 지어내는
  // 게 아니라 생략된 null을 채워 넣는 것 — map_coordinates와 같은 결정적 보정이다.
  const structured = content.blocks?.info?.hours?.structured;
  if (Array.isArray(structured)) {
    for (const entry of structured) {
      if (!("break" in entry)) entry.break = null;
      if (!("last_order" in entry)) entry.last_order = null;
    }
  }

  if (!validateContent(content)) {
    throw new Error(`콘텐츠 스키마 검증 실패: ${ajv.errorsText(validateContent.errors)}`);
  }

  return content as unknown as MiniHomepageContent;
}

/** 네트워크 오류·레이트리밋·스키마 검증 실패 모두 1회 재시도 후 포기한다(데이터 지어내기 금지). */
export async function generateContent(answers: DraftAnswers): Promise<MiniHomepageContent> {
  const coordinates = await geocodeAddress(answers.address);
  try {
    return await attemptGenerate(answers, coordinates);
  } catch (err) {
    console.error("콘텐츠 생성 실패, 1회 재시도:", err);
    return await attemptGenerate(answers, coordinates);
  }
}
