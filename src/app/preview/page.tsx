import Link from "next/link";
import { FIXTURES } from "@/content/fixtures";

export default function PreviewIndexPage() {
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>
        디자인 템플릿 프리뷰
      </h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 24 }}>
        핸드오프 fixture 6종을 렌더러로 확인합니다. (개발용 라우트)
      </p>
      <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Object.entries(FIXTURES).map(([slug, content]) => (
          <li key={slug}>
            <Link
              href={`/preview/${slug}`}
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
                {content.meta.industry_category} · {content.meta.axis_a_tone} ·{" "}
                {content.meta.axis_b_layout} · menu:{content.blocks.menu.mode}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
