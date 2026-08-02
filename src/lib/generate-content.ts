import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import Ajv2020 from "ajv/dist/2020";
import contentSchemaGeneral from "../../spec/for-frontend/general/content.schema.json";
import contentSchemaBoutiqueFitness from "../../spec/for-frontend/boutique-fitness/content.schema.json";
import { geocodeAddress } from "./geocode";
import { buildClaudeRequestBody, type ClaudeRequestBody } from "./claude-request";
import { determineVertical, RENDERER_READY_VERTICALS, type Vertical } from "./verticals";
import { notifyAdminOfGenerationFailure } from "./admin-notify";
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
 * GeneralDraftAnswers는 spec/for-frontend/general/input-questions.md의 질문 흐름을
 * 그대로 따르는 general vertical 전용 "가공 전 사업 정보"다(boutique-fitness는
 * professionals/transformations/inquiry_channels 등 완전히 다른 형태라 이 타입을
 * 쓰지 않는다 — generateContent()는 두 vertical이 공유하는 최소 필드만 요구한다).
 * axis_a_tone/axis_b_layout/cta 유형·카피(headline 등)를
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
 * Structured Outputs를 아예 포기하고, 프롬프트(SKILL_PROMPTS[vertical]에 포함된
 * schema-summary.md — 완성 예시를 뺀 구조 정의만 남긴 문서)로 구조를 지시한 뒤 ajv로 전체
 * 스키마(content.schema.json, if/then 포함)를 최종 검증하는 방식으로 바꿨다 —
 * 애초에 기술 문서 6장이 "이중 안전망"이라 부른 ajv 쪽이 사실상 유일한 강제
 * 수단이 된 것.
 *
 * ajv는 plain `Ajv`가 아니라 `ajv/dist/2020`(Ajv2020)을 써야 한다 —
 * content.schema.json이 "$schema": ".../2020-12/schema"를 선언하는데, plain
 * Ajv(draft-07 기본)로 컴파일하면 "no schema with key or ref
 * .../2020-12/schema" 에러가 난다(실측 확인). Notion 문서 6장의 예시 코드가
 * plain Ajv를 쓰고 있는데 이건 이 스키마에서는 실제로 동작하지 않는다.
 *
 * vertical(spec/README.md 3장): 콘텐츠 스키마·시스템 프롬프트가 업종별로
 * 갈라져서(현재 general/boutique-fitness), LLM 호출 전에 업종 텍스트로 vertical을
 * 먼저 정해(determineVertical) 그에 맞는 스키마·프롬프트·ajv 검증기를 골라 쓴다.
 *
 * boutique-fitness는 2026-07-18 기준 스키마/프롬프트가 실제로 완성됐지만(신규
 * 블록 3종·meta 구조 변경 등 general과 크게 다름), 렌더러는 아직 general
 * 전용이다(MiniHomepageSite.tsx가 axis_a_tone/axis_b_layout이 없으면
 * LAYOUT_ORDER[undefined]에서 크래시하고, professionals/transformations/
 * facility 블록 컴포넌트도 없음). 그래서 RENDERER_READY_VERTICALS로 실제 생성을
 * 막아둔다 — 렌더러가 준비되면 verticals.ts의 그 배열에 추가하는 것만으로 풀린다.
 */

export interface DraftHoursEntry {
  day: DayOfWeek;
  open: string | null;
  close: string | null;
  closed: boolean;
}

export interface GeneralDraftAnswers {
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

  // STEP 3 — 서비스·사진 (필수)
  menu_items: {
    name: string;
    price: string | null;
    /** "이 메뉴가 특별한 이유" 답변(STEP 4 게이트 4-5, echo-back) → menu.items[].description */
    description: string | null;
    image_url: string | null;
  }[];
  gallery_image_urls: string[];

  // STEP 4 — 더 채우면 좋아요 (선택, 하나의 게이트로 통합)
  strengths: string[]; // 4-1
  external_links: { platform: ExternalLinkPlatform; url: string }[]; // 4-2
  cta_interaction_mode: CtaInteractionMode; // 4-3
  intro: string | null; // 4-4
  /** 계기·철학 답변(4-6, about과 독립) → blocks.philosophy (top-level 블록) */
  philosophy: string | null;
  /** 공간·분위기 답변(4-7, about과 독립) → blocks.atmosphere (top-level 블록) */
  atmosphere: string | null;
  reviews: { body: string; author: string; rating: number | null }[]; // 4-8
  /** 이용방법 특이사항(4-9) — 출력 스키마의 blocks.how_it_works와 이름이 겹치지 않도록 접미사를 다르게 뒀다 */
  how_it_works_special_note: string | null;
  faq_answers: { question: string; answer: string }[]; // 4-9
}

/**
 * generateContent()가 실제로 직접 읽는 필드는 vertical 판단(determineVertical)과
 * 지오코딩(geocodeAddress)에 쓰는 이 셋뿐이다 — 나머지는 그대로
 * buildClaudeRequestBody(answers: unknown)에 JSON으로 넘어간다. general·
 * boutique-fitness의 answers 형태가 완전히 다르므로(전자는 GeneralDraftAnswers,
 * 후자는 professionals/transformations 등 별도 구조), 두 vertical이 공유하는
 * 최소 필드만 여기서 요구하고 나머지는 vertical별 answers 타입에 맡긴다.
 */
export interface MinimalDraftAnswers {
  industry_category: string;
  business_name: string;
  address: string;
}

/** vertical의 스키마/프롬프트는 있지만 렌더러가 아직 못 그리는 경우 API 라우트가 잡아서 안내용 응답으로 바꾼다. */
export class VerticalNotReadyError extends Error {
  constructor(public readonly vertical: Vertical) {
    super(`vertical "${vertical}"은 스키마는 준비됐지만 렌더러가 아직 지원하지 않습니다.`);
    this.name = "VerticalNotReadyError";
  }
}

/**
 * 3층 repair loop(spec/README.md 7장)가 최대 횟수까지 스스로 고쳐봤는데도 ajv
 * 검증을 통과하지 못했을 때만 던진다. 호출부(API 라우트)는 이 에러를 사장님에게
 * 원인 그대로 보여주지 않고 일반화된 메시지로 대체해야 한다 — 검증 오류 원문은
 * admin-notify.ts를 통해 관리자에게만 전달된다.
 */
export class ContentGenerationFailedError extends Error {
  constructor(
    public readonly vertical: Vertical,
    public readonly lastError: unknown
  ) {
    super(
      `${vertical} 콘텐츠 생성이 반복 수정 후에도 검증을 통과하지 못함: ${
        lastError instanceof Error ? lastError.message : String(lastError)
      }`
    );
    this.name = "ContentGenerationFailedError";
  }
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// vertical마다 독립된 Ajv 인스턴스를 쓴다 — 두 스키마의 $id가 같아서(현재 동일
// 복사본) 하나의 Ajv 인스턴스에 둘 다 compile하면 "schema with key already
// exists" 충돌이 난다. errorsText도 컴파일에 쓴 인스턴스로 호출해야 하므로
// validate와 ajv를 한 쌍으로 묶어 보관한다.
function buildValidator(schema: object) {
  const ajv = new Ajv2020({ strict: false });
  return { ajv, validate: ajv.compile(schema) };
}

const validators: Record<Vertical, ReturnType<typeof buildValidator>> = {
  general: buildValidator(contentSchemaGeneral),
  "boutique-fitness": buildValidator(contentSchemaBoutiqueFitness),
};

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

/**
 * Claude 응답 텍스트(원문 그대로, 코드펜스 있어도 됨) → 결정적 보정 → ajv 검증까지
 * 처리하는 공용 함수. 자동 파이프라인(attemptGenerate)과 수동 테스트 흐름(POST
 * /api/sites/manual — 사람이 claude.ai에서 직접 받아온 응답을 붙여넣는 경로)이
 * 이 함수 하나를 공유한다 — 보정·검증 로직이 두 경로에서 갈라지지 않게 하기 위해서다.
 */
export function processGeneratedContent(
  rawText: string,
  vertical: Vertical,
  coordinates: { lat: number; lng: number }
): unknown {
  const content = JSON.parse(stripCodeFence(rawText)) as {
    blocks?: {
      info?: {
        map_coordinates?: unknown;
        hours?: { type: string; structured?: Record<string, unknown>[] | null };
      };
      philosophy?: unknown;
      atmosphere?: unknown;
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

  // philosophy는 about과 독립된 top-level 블록으로 분리됐고, Blocks.required 목록에도
  // 없다 — 즉 "값 없음"을 표현하는 방법이 명시적 null과 키 자체 생략 두 가지가 다
  // 스키마상 허용된다. Claude가 후자(키 생략)를 택하면 우리 TS 타입(Blocks.philosophy:
  // Philosophy | null, 항상 존재)과 어긋나므로, hours.break와 같은 원칙으로 생략된 키를
  // null로 채워 넣어 형태를 통일한다.
  if (content.blocks && !("philosophy" in content.blocks)) {
    content.blocks.philosophy = null;
  }
  // atmosphere는 general에만 있는 top-level 블록이다 — boutique-fitness는 2026-07-17에
  // facility.atmosphere_text로 흡수되면서 blocks.atmosphere 키 자체가 스키마에서
  // 사라졌다(additionalProperties:false). vertical 구분 없이 이 보정을 적용하면
  // boutique-fitness에서 스키마에 없는 키를 강제로 주입하게 돼 ajv 검증이 100% 실패한다.
  if (vertical === "general" && content.blocks && !("atmosphere" in content.blocks)) {
    content.blocks.atmosphere = null;
  }

  const { ajv, validate } = validators[vertical];
  if (!validate(content)) {
    throw new Error(`콘텐츠 스키마 검증 실패: ${ajv.errorsText(validate.errors)}`);
  }

  return content;
}

// 초기 호출 1회 + 검증 실패 시 수정 요청 최대 2회 = 총 최대 3회 API 호출.
const MAX_REPAIR_ATTEMPTS = 2;

/**
 * 3층(런타임 repair loop, spec/README.md 7장): 첫 응답이 ajv 검증에 실패하면
 * 같은 대화(멀티턴)에 방금 받은(깨진) 응답과 ajv 에러 메시지를 이어붙여 "이 오류를
 * 고쳐서 JSON만 다시 응답해"라고 재요청한다 — 매번 처음부터 새로 생성시키는
 * 것보다, 무엇이 왜 틀렸는지 알려주고 고치게 하는 쪽이 같은 실수를 반복할
 * 확률이 낮다. 최대 횟수까지 실패하면 ContentGenerationFailedError를 던진다.
 */
async function generateWithRepairLoop(
  answers: MinimalDraftAnswers,
  coordinates: { lat: number; lng: number },
  vertical: Vertical
): Promise<MiniHomepageContent> {
  const requestBody = buildClaudeRequestBody(vertical, answers);
  const messages: ClaudeRequestBody["messages"] = [...requestBody.messages];

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_REPAIR_ATTEMPTS; attempt++) {
    const response = await client.messages.create({ ...requestBody, messages });
    const rawText = extractText(response);

    try {
      const content = processGeneratedContent(rawText, vertical, coordinates);
      return content as MiniHomepageContent;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_REPAIR_ATTEMPTS) break;
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`콘텐츠 검증 실패, 수정 요청 ${attempt + 1}/${MAX_REPAIR_ATTEMPTS}회:`, errorMessage);
      messages.push({ role: "assistant", content: rawText });
      messages.push({
        role: "user",
        content: `아래 검증 오류를 수정해서 JSON만 다시 응답해:\n${errorMessage}`,
      });
    }
  }

  throw new ContentGenerationFailedError(vertical, lastError);
}

/**
 * vertical을 content와 함께 반환하는 이유: 호출부(POST /api/sites)가
 * sites.vertical 컬럼에 저장할 값이 필요한데, determineVertical()을 호출부에서
 * 따로 한 번 더 부르면 이 함수 내부 판단과 어긋날 여지가 생긴다 — 이 함수가
 * 실제로 쓴 값을 그대로 돌려줘서 content_json과 vertical이 항상 같은 판단
 * 결과를 가리키도록 보장한다.
 *
 * repair loop(검증 실패 자체 수정)와 별개로, 네트워크 오류·레이트리밋처럼
 * 검증과 무관한 오류만 여기서 1회 추가 재시도한다. repair loop이 최대
 * 횟수까지 스스로 고쳐봤는데도 실패한 경우(ContentGenerationFailedError)는
 * 같은 입력으로 다시 시도해도 반복될 가능성이 높으므로 재시도하지 않고 바로
 * 관리자에게 알린 뒤 그대로 던진다 — 사장님에게는 호출부가 일반화된 메시지로
 * 대체한다.
 */
export async function generateContent(
  answers: MinimalDraftAnswers
): Promise<{ content: MiniHomepageContent; vertical: Vertical }> {
  const vertical = determineVertical(answers.industry_category);
  if (!RENDERER_READY_VERTICALS.includes(vertical)) {
    // 지오코딩·Claude 호출 전에 막아서 비용 낭비도 함께 없앤다.
    throw new VerticalNotReadyError(vertical);
  }
  const coordinates = await geocodeAddress(answers.address);

  try {
    const content = await generateWithRepairLoop(answers, coordinates, vertical);
    return { content, vertical };
  } catch (err) {
    if (err instanceof ContentGenerationFailedError) {
      await notifyAdminOfGenerationFailure({
        vertical,
        businessName: answers.business_name,
        error: err,
      });
      throw err;
    }

    console.error("콘텐츠 생성 실패(네트워크/API), 1회 재시도:", err);
    try {
      const content = await generateWithRepairLoop(answers, coordinates, vertical);
      return { content, vertical };
    } catch (retryErr) {
      if (retryErr instanceof ContentGenerationFailedError) {
        await notifyAdminOfGenerationFailure({
          vertical,
          businessName: answers.business_name,
          error: retryErr,
        });
      }
      throw retryErr;
    }
  }
}
