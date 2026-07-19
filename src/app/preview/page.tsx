import Link from "next/link";
import { listSites } from "@/lib/sites";

/** general/boutique-fitness 공통 필드만 — 나머지(axis_a_tone 등)는 vertical마다 갈려서
 * 이 개발용 목록 페이지에서는 다루지 않는다. */
interface CommonMeta {
  meta: { business_name: string; industry_category: string };
}

export default async function PreviewIndexPage() {
  const sites = await listSites();

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
        디자인 템플릿 프리뷰
      </h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>
        DB(sites 테이블)에 저장된 콘텐츠를 렌더러로 확인합니다. (개발용 라우트)
      </p>
      <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sites.map((site) => {
          const content = site.content_json as CommonMeta;
          return (
            <li key={site.id}>
              <Link
                href={`/preview/${site.slug}`}
                style={{
                  display: "block",
                  padding: "14px 16px",
                  border: "1px solid #ddd",
                  borderRadius: 10,
                  textDecoration: "none",
                  color: "#111",
                }}
              >
                <strong>{content.meta.business_name}</strong>
                <div style={{ fontSize: 12, color: "#777", marginTop: 4 }}>
                  {content.meta.industry_category} · {site.vertical}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
