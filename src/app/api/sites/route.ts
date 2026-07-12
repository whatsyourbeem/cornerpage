import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { generateContent, type DraftAnswers } from "@/lib/generate-content";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Claude 콘텐츠 생성은 재시도 없이도 70초 넘게 걸리는 경우가 실측됐다(1회
// 재시도까지 겹치면 더 길어질 수 있음) — Vercel 기본 10초 제한을 넉넉히 늘려둔다.
// Vercel Hobby 플랜은 이 값과 무관하게 60초로 강제 제한되니, 실제 운영 중
// 타임아웃이 잦으면 플랜 업그레이드가 필요할 수 있다.
export const maxDuration = 120;

/**
 * 최종 제출. /api/sites/draft에서 발급한 id를 그대로 DB row id로 쓴다
 * (slug는 비워두면 트리거가 id로 채운다 — 나중에 유저가 원하는 값으로 바꿀 수 있음).
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

  let content;
  try {
    content = await generateContent(answers);
  } catch (err) {
    console.error("content generation failed:", err);
    return NextResponse.json(
      { error: "콘텐츠 생성에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

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
