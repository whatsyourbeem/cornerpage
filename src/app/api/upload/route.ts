import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SLOT_RE = /^[a-z0-9-]{1,40}$/;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/**
 * 이미지 업로드 → site-images 버킷. 브라우저가 Storage에 직접 쓰지 않고
 * 항상 이 라우트(service_role 키 보유)를 거치게 해서, 인증 없는 anon
 * 업로드를 아예 막아둔다.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const form = await request.formData();
  const siteId = form.get("site_id");
  const slot = form.get("slot");
  const file = form.get("file");

  if (typeof siteId !== "string" || !UUID_RE.test(siteId)) {
    return NextResponse.json({ error: "invalid site_id" }, { status: 400 });
  }
  if (typeof slot !== "string" || !SLOT_RE.test(slot)) {
    return NextResponse.json({ error: "invalid slot" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "file too large (max 8MB)" }, { status: 400 });
  }
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "unsupported file type (jpeg/png/webp/gif only)" },
      { status: 400 }
    );
  }

  // site_id는 클라이언트가 그대로 보내는 값이라 저장 경로를 남의 사이트 폴더로
  // 지목할 수 있다 — 편집 화면은 실재하는 site id를 브라우저에 노출하므로 특히
  // 중요하다. 이미 존재하는 row면 반드시 본인 소유여야 하고, 아직 없는 id면
  // 생성 흐름(/api/sites/draft가 방금 발급했고 저장 시점에 그 id로 insert된다)
  // 이므로 통과시킨다. 후자는 남의 데이터를 건드릴 수 없고(경로가 아직 아무
  // 사이트의 것도 아니다) 로그인도 이미 요구했다.
  const { data: site, error: siteError } = await supabaseAdmin
    .from("sites")
    .select("owner_id")
    .eq("id", siteId)
    .maybeSingle();

  if (siteError) {
    console.error("site lookup failed:", siteError.message);
    return NextResponse.json({ error: "failed to check site" }, { status: 500 });
  }
  if (site && site.owner_id !== user.id) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  // 같은 slot에 upsert로 덮어쓰면 이미 배포된 public URL이 그대로라 CDN·브라우저
  // 캐시가 옛 이미지를 계속 보여준다 — 편집 화면에서 사진을 바꿨는데 사이트는
  // 안 바뀌는 것처럼 보이는 문제. 파일명에 난수를 붙여 항상 새 URL을 만든다
  // (경로를 재구성하는 코드는 없다 — 저장되는 건 언제나 이 응답의 URL뿐이다).
  // 교체된 옛 파일은 버킷에 남는다 — 정리는 별도 과제.
  const suffix = crypto.randomUUID().slice(0, 8);
  const path = `${siteId}/${slot}-${suffix}.${ext}`;
  const { error: uploadError } = await supabaseAdmin.storage
    .from("site-images")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (uploadError) {
    console.error("upload failed:", uploadError.message);
    return NextResponse.json({ error: "upload failed" }, { status: 500 });
  }

  const { data } = supabaseAdmin.storage.from("site-images").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
