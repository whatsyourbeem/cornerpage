import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { generateContent, VerticalNotReadyError, type DraftAnswers } from "@/lib/generate-content";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// 계정당 생성 가능한 최대 사이트 수. plan이 생기면(profiles.plan) 이 상수 대신
// 플랜별 한도로 바꾼다.
const MAX_SITES_PER_ACCOUNT = 3;

// Claude 콘텐츠 생성은 재시도 없이도 70초 넘게 걸리는 경우가 실측됐다(1회
// 재시도까지 겹치면 더 길어질 수 있음) — Vercel 기본 10초 제한을 넉넉히 늘려둔다.
// Vercel Hobby 플랜은 이 값과 무관하게 60초로 강제 제한되니, 실제 운영 중
// 타임아웃이 잦으면 플랜 업그레이드가 필요할 수 있다.
export const maxDuration = 120;

/**
 * 최종 제출. /api/sites/draft에서 발급한 id를 그대로 DB row id로 쓴다
 * (slug는 비워두면 set_default_slug 트리거가 id와 무관한 무작위 20자 hex로
 * 채운다 — 20260711040000_use_random_slug.sql. insert 응답의 id를 slug로
 * 오인해 돌려주면 안 된다 — 실제 slug 컬럼 값을 다시 select해서 반환한다).
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
  const { id, answers } = body as { id: string; answers: DraftAnswers };

  if (typeof id !== "string" || !UUID_RE.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }
  if (!answers?.business_name) {
    return NextResponse.json({ error: "business_name is required" }, { status: 400 });
  }

  let content, vertical;
  try {
    ({ content, vertical } = await generateContent(answers));
  } catch (err) {
    if (err instanceof VerticalNotReadyError) {
      return NextResponse.json(
        { error: "죄송해요, 이 업종은 아직 준비 중이에요. 곧 지원할 예정이에요." },
        { status: 422 }
      );
    }
    console.error("content generation failed:", err);
    return NextResponse.json(
      { error: "콘텐츠 생성에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  const { data: inserted, error } = await supabaseAdmin
    .from("sites")
    .insert({
      id,
      owner_id: user.id,
      vertical,
      business_name: content.meta.business_name,
      content_json: content,
    })
    .select("slug")
    .single();

  if (error) {
    console.error("site insert failed:", error.message);
    return NextResponse.json({ error: "failed to create site" }, { status: 500 });
  }

  return NextResponse.json({ id, slug: inserted.slug });
}
