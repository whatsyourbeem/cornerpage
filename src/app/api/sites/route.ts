import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { buildMockContent, type DraftAnswers } from "@/lib/mock-generate-content";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 최종 제출. /api/sites/draft에서 발급한 id를 그대로 DB row id로 쓴다
 * (slug는 비워두면 트리거가 id로 채운다 — 나중에 유저가 원하는 값으로 바꿀 수 있음).
 *
 * TODO: buildMockContent(answers)를 실제 mini-homepage-builder 스킬 호출로
 * 교체할 자리. 이미지 URL은 그때도 지금처럼 answers에 이미 확정되어 들어오고,
 * 스킬은 텍스트만 보고 카피·구조를 판단한다.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { id, answers } = body as { id: string; answers: DraftAnswers };

  if (typeof id !== "string" || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  if (!answers?.business_name) {
    return NextResponse.json({ error: "business_name is required" }, { status: 400 });
  }

  const content = buildMockContent(answers);

  const { error } = await supabaseAdmin.from("sites").insert({
    id,
    business_name: content.meta.business_name,
    content_json: content,
  });

  if (error) {
    console.error("site insert failed:", error.message);
    return NextResponse.json({ error: "failed to create site" }, { status: 500 });
  }

  return NextResponse.json({ id, slug: id });
}
