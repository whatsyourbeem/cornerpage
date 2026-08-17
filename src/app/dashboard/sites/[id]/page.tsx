import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { SiteRow } from "@/lib/sites";
import type { MiniHomepageContent } from "@/lib/content-types-boutique-fitness";
import { isProPlan } from "@/lib/plan";
import { EDITABLE_VERTICALS, type Vertical } from "@/lib/verticals";
import { Badge, Panel, cx } from "@/components/ui";
import { SlugEditor } from "../../SlugEditor";
import { SiteEditor } from "./SiteEditor";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 사이트 한 개의 관리/편집 화면. 대시보드에서 홈페이지를 클릭하면 완성된 사이트로
 * 바로 나가는 대신 여기로 들어온다 — 사이트를 "보는" 곳이 아니라 "다루는" 곳이고,
 * 주소 변경·플랜 확인·블록 편집이 전부 여기 모인다(대시보드는 목록 역할만 남는다).
 *
 * 블록 편집기는 vertical별 스키마에 1:1로 붙는 UI라 EDITABLE_VERTICALS에 있는
 * vertical에만 열린다. 나머지는 이 페이지가 주소·플랜 관리 화면으로만 동작한다.
 */
export default async function SiteManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/dashboard/sites/${id}`);
  }

  const { data } = await supabase.from("sites").select("*").eq("id", id).maybeSingle();
  const site = data as SiteRow | null;

  // sites는 공개 읽기(RLS)라 남의 사이트도 조회 자체는 된다 — 소유자가 아니면
  // "권한 없음"이 아니라 404로 처리해서 특정 id의 존재 여부까지 흘리지 않는다.
  if (!site || site.owner_id !== user.id) notFound();

  const isEditable = EDITABLE_VERTICALS.includes(site.vertical as Vertical);
  const isPro = isProPlan(site);

  return (
    // 편집기는 넓은 화면에서 편집 칸과 미리보기를 나란히 놓기 때문에 대시보드
    // 기본 폭(max-w-md)으로는 좁다 — 편집기가 없는 vertical은 그대로 둔다.
    <main
      className={cx(
        "mx-auto w-full bg-cp-canvas px-5 py-8 text-cp-fg",
        isEditable ? "max-w-5xl" : "max-w-md"
      )}
    >
      <Link
        href="/dashboard"
        className="mb-5 inline-flex items-center gap-1 text-[13px] font-semibold text-cp-muted hover:text-cp-body"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        마이페이지
      </Link>

      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-cp-h4 font-bold">{site.business_name}</h1>
        {isPro && (
          <Badge tone="primary" variant="weak">
            구독 중
          </Badge>
        )}
      </div>
      <a
        href={`/site/${site.slug}`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-cp-primary hover:underline"
      >
        홈페이지 열기
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>

      <Panel tone="outline" className="mt-6">
        <h2 className="text-[15px] font-bold text-cp-fg">홈페이지 주소</h2>
        {isPro ? (
          <SlugEditor siteId={site.id} currentSlug={site.slug} />
        ) : (
          <>
            <p className="mt-1 text-[13px] text-cp-body">{site.slug}</p>
            <p className="mt-1 text-[12px] text-cp-muted">
              다음 주소 변경 예정일: {new Date(site.slug_rotates_at).toLocaleDateString("ko-KR")}
            </p>
            <p className="mt-2 text-[12px] text-cp-muted">
              구독하면 주소가 바뀌지 않고, 원하는 주소로 직접 바꿀 수 있어요.
            </p>
          </>
        )}
      </Panel>

      {isEditable ? (
        <SiteEditor
          siteId={site.id}
          initialContent={site.content_json as MiniHomepageContent}
          initialUpdatedAt={site.updated_at}
        />
      ) : (
        <Panel tone="surface" className="mt-3">
          <h2 className="text-[15px] font-bold text-cp-fg">내용 편집</h2>
          <p className="mt-1 text-[13px] text-cp-body">
            이 업종은 편집 기능을 준비 중이에요. 조금만 기다려주세요.
          </p>
        </Panel>
      )}
    </main>
  );
}
