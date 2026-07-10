import { notFound } from "next/navigation";
import { MiniHomepageSite } from "@/components/site/MiniHomepageSite";
import { FIXTURES } from "@/content/fixtures";

/**
 * {uuid}.cornerpage.co의 실제 서빙 경로 (src/proxy.ts가 여기로 rewrite한다).
 *
 * DB가 아직 없어서, 지금은 FIXTURES를 "가짜 DB"로 삼아 uuid 자리에 fixture
 * slug를 그대로 쓴다. 나중에 실제 DB가 생기면 아래 조회 한 줄만
 * `await db.sites.findByUuid(uuid)`로 바꾸면 되고, 렌더링 경로 자체는 안 바뀐다.
 */
export default async function SitePage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const content = FIXTURES[uuid];
  if (!content) notFound();

  return <MiniHomepageSite content={content} />;
}
