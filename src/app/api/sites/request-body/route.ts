import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { buildClaudeRequestBody } from "@/lib/claude-request";
import { VERTICALS, type Vertical } from "@/lib/verticals";

/**
 * 클로드 API를 호출하지 않고, 실제로 보낼 요청 본문(system+messages)만 만들어
 * 돌려준다. generate-content.ts의 attemptGenerate와 같은 buildClaudeRequestBody를
 * 쓰므로 여기서 보여주는 본문이 자동 호출 시 나가는 것과 완전히 같다.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await request.json();
  const { vertical, answers } = body as { vertical: string; answers: unknown };

  if (!VERTICALS.includes(vertical as Vertical)) {
    return NextResponse.json({ error: "invalid vertical" }, { status: 400 });
  }
  if (!answers || typeof answers !== "object") {
    return NextResponse.json({ error: "answers is required" }, { status: 400 });
  }

  const requestBody = buildClaudeRequestBody(vertical as Vertical, answers);
  return NextResponse.json({ requestBody });
}
