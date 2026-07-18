import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { processGeneratedContent } from "@/lib/generate-content";
import { geocodeAddress } from "@/lib/geocode";
import { VERTICALS, type Vertical } from "@/lib/verticals";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// /api/sites와 동일한 계정당 한도 — plan이 생기면 이 상수 대신 플랜별 한도로 바꾼다.
const MAX_SITES_PER_ACCOUNT = 3;

// 지오코딩(외부 API) 정도라 /api/sites만큼 느리진 않지만, Claude 호출이 빠진 만큼
// 여유를 넉넉히 둘 필요는 없다.
export const maxDuration = 30;

/**
 * 3단계(Claude API 호출)를 사람이 대신하는 수동 테스트 경로 — POST
 * /api/sites/request-body가 보여준 요청 본문을 사람이 claude.ai 등에 직접
 * 붙여넣어 받은 응답 텍스트를 그대로 받아서, 자동 파이프라인(/api/sites)과 같은
 * processGeneratedContent(보정+ajv 검증)를 거쳐 저장한다.
 *
 * RENDERER_READY_VERTICALS 게이트를 여기서는 적용하지 않는다 — 렌더러가 아직
 * boutique-fitness를 못 그려도 DB·검증 루프 전체를 먼저 테스트할 수 있어야
 * 한다는 판단(2026-07-19). 즉 이 경로로 만든 boutique-fitness 사이트는 지금
 * 방문하면 깨질 수 있다는 걸 알고 쓰는 것 — /api/sites(자동 경로)는 여전히 막혀있다.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const { count, error: countError } = await supabaseAdmin
    .from("sites")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (countError) {
    console.error("site count check failed:", countError.message);
    return NextResponse.json({ error: "failed to check site count" }, { status: 500 });
  }
  if ((count ?? 0) >= MAX_SITES_PER_ACCOUNT) {
    return NextResponse.json(
      { error: `계정당 최대 ${MAX_SITES_PER_ACCOUNT}개까지 만들 수 있어요.` },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { id, vertical, answers, claude_response_text } = body as {
    id: string;
    vertical: string;
    answers: { address?: unknown; business_name?: unknown };
    claude_response_text: string;
  };

  if (typeof id !== "string" || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  if (!VERTICALS.includes(vertical as Vertical)) {
    return NextResponse.json({ error: "invalid vertical" }, { status: 400 });
  }
  if (typeof answers?.address !== "string" || !answers.address) {
    return NextResponse.json({ error: "invalid answers" }, { status: 400 });
  }
  if (typeof claude_response_text !== "string" || !claude_response_text.trim()) {
    return NextResponse.json({ error: "클로드 응답을 붙여넣어주세요." }, { status: 400 });
  }

  const coordinates = await geocodeAddress(answers.address);

  let content: unknown;
  try {
    content = processGeneratedContent(claude_response_text, vertical as Vertical, coordinates);
  } catch (err) {
    console.error("manual content processing failed:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "응답 처리에 실패했어요. JSON 형식과 스키마를 확인해주세요.",
      },
      { status: 422 }
    );
  }

  const businessName =
    (content as { meta?: { business_name?: string } })?.meta?.business_name ??
    (typeof answers.business_name === "string" ? answers.business_name : "") ??
    "";

  const { error } = await supabaseAdmin.from("sites").insert({
    id,
    owner_id: user.id,
    vertical,
    business_name: businessName,
    content_json: content,
  });

  if (error) {
    console.error("site insert failed:", error.message);
    return NextResponse.json({ error: "failed to create site" }, { status: 500 });
  }

  return NextResponse.json({ id, slug: id });
}
