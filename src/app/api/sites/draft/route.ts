import { NextResponse } from "next/server";

/**
 * 폼 세션 시작 시 site id를 미리 발급한다. 이 id를 이미지 업로드 경로
 * (site-images/{id}/...)와 최종 DB row id에 그대로 재사용해서, 업로드가
 * 먼저 끝나 있어도 나중에 어느 site의 것인지 흔들리지 않게 한다.
 */
export async function POST() {
  return NextResponse.json({ id: crypto.randomUUID() });
}
