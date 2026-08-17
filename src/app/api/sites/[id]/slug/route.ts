import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SLUG_RE } from "@/lib/sites";
import { isProPlan } from "@/lib/plan";

/**
 * 유료(pro) 계정만 자기 사이트의 slug를 원하는 값으로 바꿀 수 있다.
 * free는 이 경로를 몰라도 되게(로테이션 잡만 slug를 건드림) 403으로 막는다.
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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("profile load failed:", profileError?.message);
    return NextResponse.json({ error: "failed to load profile" }, { status: 500 });
  }

  if (!isProPlan(profile)) {
    return NextResponse.json({ error: "주소 변경은 유료 구독 회원만 가능해요." }, { status: 403 });
  }

  const { data: site, error: siteError } = await supabaseAdmin
    .from("sites")
    .select("id, owner_id")
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
