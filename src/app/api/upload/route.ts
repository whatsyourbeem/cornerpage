import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

  const path = `${siteId}/${slot}.${ext}`;
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
