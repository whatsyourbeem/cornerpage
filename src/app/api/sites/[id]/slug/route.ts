import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SLUG_RE } from "@/lib/sites";
import { isProPlan } from "@/lib/plan";

/**
 * 결제는 계정이 아니라 사이트 단위다 — 계정에 사이트가 3개 있으면 slug를
 * 고정하고 싶은 사이트마다 각각 구독해야 한다. 그래서 plan/plan_expires_at도
 * profiles가 아니라 이 사이트 row 자체(sites.plan)를 본다.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await request.json();
  const { slug } = body as { slug?: unknown };

  if (typeof slug !== "string" || !SLUG_RE.test(slug)) {
    return NextResponse.json(
      { error: "소문자·숫자·하이픈만 사용할 수 있어요 (하이픈으로 시작·끝 불가, 63자 이하)." },
      { status: 400 }
    );
  }

  const { data: site, error: siteError } = await supabaseAdmin
    .from("sites")
    .select("id, owner_id, plan, plan_expires_at")
    .eq("id", id)
    .maybeSingle();

  if (siteError) {
    console.error("site lookup failed:", siteError.message);
    return NextResponse.json({ error: "failed to load site" }, { status: 500 });
  }
  if (!site) {
    return NextResponse.json({ error: "site not found" }, { status: 404 });
  }
  if (site.owner_id !== user.id) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }
  if (!isProPlan(site)) {
    return NextResponse.json({ error: "이 홈페이지는 구독 중이 아니에요. 주소 변경은 구독한 사이트만 가능해요." }, { status: 403 });
  }

  const { error: updateError } = await supabaseAdmin.from("sites").update({ slug }).eq("id", id);

  if (updateError) {
    if (updateError.code === "23505") {
      return NextResponse.json({ error: "이미 사용 중인 주소예요." }, { status: 409 });
    }
    console.error("slug update failed:", updateError.message);
    return NextResponse.json({ error: "주소 변경에 실패했어요." }, { status: 500 });
  }

  return NextResponse.json({ slug });
}
