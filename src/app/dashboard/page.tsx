import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { SiteRow } from "@/lib/sites";
import { isProPlan } from "@/lib/plan";
import { LogoutButton } from "./LogoutButton";
import { Panel } from "@/components/ui";

const MAX_SITES_PER_ACCOUNT = 3;

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const { data: sites } = await supabase
    .from("sites")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  const mySites = (sites ?? []) as SiteRow[];

  return (
    <main className="mx-auto w-full max-w-md bg-cp-canvas px-5 py-10 text-cp-fg">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-cp-h4 font-bold">마이페이지</h1>
        <LogoutButton />
      </div>

      <p className="mb-1 text-[13px] text-cp-body">{user.email}</p>
      <p className="mb-6 text-[13px] text-cp-muted">
        내 홈페이지 {mySites.length}/{MAX_SITES_PER_ACCOUNT}개 사용 중
      </p>

      {/*
        카드를 누르면 완성된 홈페이지가 아니라 관리/편집 화면으로 들어간다 —
        사장님이 대시보드에서 하려는 일은 "보기"가 아니라 "고치기"이고, 완성된
        사이트는 그 안의 "홈페이지 열기"로 언제든 열 수 있다. 주소 변경도 카드가
        아니라 그 화면에 있다(카드는 목록 역할만).
      */}
      <ul className="flex flex-col gap-2.5">
        {mySites.map((site) => (
          <li key={site.id}>
            <Link href={`/dashboard/sites/${site.id}`} className="block">
              <Panel tone="outline" className="transition-colors hover:bg-cp-surface">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-[15px] font-bold text-cp-fg">{site.business_name}</strong>
                  <ChevronRight className="h-4 w-4 flex-none text-cp-muted" aria-hidden />
                </div>
                <p className="mt-1 text-[12px] text-cp-muted">
                  {isProPlan(site)
                    ? `주소: ${site.slug}`
                    : `다음 주소 변경 예정일: ${new Date(site.slug_rotates_at).toLocaleDateString("ko-KR")}`}
                </p>
              </Panel>
            </Link>
          </li>
        ))}
      </ul>

      {mySites.length === 0 && <p className="text-[13px] text-cp-muted">아직 만든 홈페이지가 없어요.</p>}

      {mySites.length < MAX_SITES_PER_ACCOUNT && (
        <Link
          href="/create"
          className="mt-5 flex items-center justify-center rounded-cp-btn-lg bg-cp-primary px-4 py-3.5 text-center text-[15px] font-bold text-cp-on-primary hover:bg-cp-primary-hover"
        >
          새 홈페이지 만들기
        </Link>
      )}
    </main>
  );
}
