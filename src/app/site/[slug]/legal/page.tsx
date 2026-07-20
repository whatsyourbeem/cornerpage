import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteBySlug } from "@/lib/sites";
import { buildLegalDocuments, type LegalDocument } from "@/lib/legal-boutique-fitness";
import type { MiniHomepageContent } from "@/lib/content-types-boutique-fitness";
import styles from "./legal.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) return {};
  const content = site.content_json as { meta: { business_name: string } };
  return { title: `이용약관·개인정보처리방침 - ${content.meta.business_name}` };
}

function LegalDocumentSection({ id, document }: { id: string; document: LegalDocument }) {
  return (
    <section id={id} className={styles.section}>
      <h2 className={styles.title}>{document.title}</h2>
      {document.intro && <p className={styles.intro}>{document.intro}</p>}
      {document.sections.map((s, i) => (
        <div key={i} className={styles.clause}>
          {s.heading && <h3 className={styles.heading}>{s.heading}</h3>}
          <p className={styles.body}>{s.body}</p>
        </div>
      ))}
    </section>
  );
}

/**
 * legal-template.md 고정 문구 + 콘텐츠 JSON 변수 치환 — LLM 호출 없는 정적 렌더링.
 * boutique-fitness 전용(다른 vertical은 아직 이 라우트를 안 씀).
 */
export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site || site.vertical !== "boutique-fitness") notFound();

  const content = site.content_json as MiniHomepageContent;
  const { terms, privacy } = buildLegalDocuments(content);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <LegalDocumentSection id="terms" document={terms} />
        <LegalDocumentSection id="privacy" document={privacy} />
        <p className={styles.disclaimer}>
          본 문서는 일반적인 소상공인 서비스 기준의 표준 템플릿이며, 법률 전문가 검토를 거치지
          않았습니다.
        </p>
      </div>
    </div>
  );
}
