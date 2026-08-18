import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { formatValidationErrors, validateContent } from "@/lib/content-schema";
import { describeContentPath } from "@/lib/content-field-labels";
import { geocodeAddress } from "@/lib/geocode";
import { EDITABLE_VERTICALS, type Vertical } from "@/lib/verticals";

/** 두 vertical이 공유하는, 이 라우트가 실제로 들여다보는 최소 형태. */
interface EditableContent {
  meta: { business_name?: unknown };
  blocks: { info?: { address?: unknown; map_coordinates?: unknown } };
}

function isEditableContent(value: unknown): value is EditableContent {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.meta === "object" && candidate.meta !== null &&
    typeof candidate.blocks === "object" && candidate.blocks !== null;
}

/**
 * 관리/편집 화면의 저장. 사장님이 블록 편집기에서 고친 content_json을 통째로 받아
 * 검증 후 덮어쓴다.
 *
 * sites에는 content_json만 저장되고 입력 원본(answers)은 남지 않으므로, 편집은
 * Claude 재생성이 아니라 content_json 직접 수정이다 — 재생성 경로는 원재료가 없어
 * 애초에 불가능하고, 가능하더라도 사장님이 손댄 부분까지 같이 날아간다.
 *
 * 검증은 생성 경로와 같은 ajv 검증기(content-schema.ts)를 쓴다. 렌더러는
 * content_json이 스키마를 지킨다는 전제로 쓰여 있어서, 여기로 들어온 값이
 * 조금이라도 어긋나면 사이트가 깨진 채로 배포된다.
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
  const { content_json: content, base_updated_at: baseUpdatedAt } = body as {
    content_json?: unknown;
    base_updated_at?: unknown;
  };

  if (!isEditableContent(content)) {
    return NextResponse.json({ error: "invalid content_json" }, { status: 400 });
  }

  const { data: site, error: siteError } = await supabaseAdmin
    .from("sites")
    .select("id, owner_id, vertical, content_json, updated_at")
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
  if (!EDITABLE_VERTICALS.includes(site.vertical as Vertical)) {
    return NextResponse.json(
      { error: "이 업종은 아직 편집 기능을 준비 중이에요." },
      { status: 403 }
    );
  }

  // 편집기를 연 시점 이후에 다른 탭·기기에서 저장이 있었으면 덮어쓰지 않는다.
  // 조회와 update 사이의 짧은 경합까지는 막지 못하지만, 실제로 문제가 되는
  // "한참 전에 열어둔 탭이 통째로 되돌려놓는" 경우는 이걸로 걸러진다.
  if (typeof baseUpdatedAt === "string" && baseUpdatedAt !== site.updated_at) {
    return NextResponse.json(
      { error: "다른 곳에서 먼저 저장됐어요. 새로고침 후 다시 시도해주세요." },
      { status: 409 }
    );
  }

  // map_coordinates는 생성 경로와 동일하게 백엔드가 결정적으로 채운다 —
  // 클라이언트가 보낸 좌표는 신뢰하지 않는다(geocode.ts 주석 참고). 주소가
  // 그대로면 기존 좌표를 재사용해서 불필요한 외부 호출을 아낀다.
  const previousInfo = (site.content_json as EditableContent | null)?.blocks?.info;
  const address = content.blocks.info?.address;
  if (content.blocks.info && typeof address === "string") {
    content.blocks.info.map_coordinates =
      address === previousInfo?.address && previousInfo?.map_coordinates
        ? previousInfo.map_coordinates
        : await geocodeAddress(address);
  }

  const vertical = site.vertical as Vertical;
  const errors = validateContent(vertical, content);
  if (errors) {
    console.error(`편집 저장 검증 실패(site ${id}):`, formatValidationErrors(vertical, errors));
    return NextResponse.json(
      {
        error: "저장할 수 없는 값이 있어요. 아래 항목을 확인해주세요.",
        details: errors.slice(0, 10).map((err) => ({
          path: err.instancePath,
          label: describeContentPath(err.instancePath),
          message: err.message ?? "",
        })),
      },
      { status: 400 }
    );
  }

  // business_name 컬럼은 대시보드 목록이 읽는 값이라 meta.business_name과 함께
  // 움직여야 한다 — 검증을 통과했으면 이 필드는 반드시 문자열이다.
  const { data: updated, error: updateError } = await supabaseAdmin
    .from("sites")
    .update({ content_json: content, business_name: content.meta.business_name as string })
    .eq("id", id)
    .select("content_json, updated_at")
    .single();

  if (updateError) {
    console.error("content update failed:", updateError.message);
    return NextResponse.json({ error: "저장에 실패했어요." }, { status: 500 });
  }

  // 저장된 값을 그대로 돌려준다 — map_coordinates는 서버가 덮어쓰기 때문에, 편집기가
  // 자기 로컬 상태를 그대로 "저장됨"으로 취급하면 DB와 미세하게 어긋난 채로 남는다.
  return NextResponse.json({ content_json: updated.content_json, updated_at: updated.updated_at });
}
