import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSiteBySlug } from "@/lib/sites";
import { buildLegalDocuments, type LegalDocument, type LegalInfo, type LegalMeta } from "@/lib/legal";
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
 * 공용 legal 템플릿(@/lib/legal) + 콘텐츠 JSON 변수 치환 — LLM 호출 없는 정적 렌더링.
 * meta.business_name·blocks.info.{address,phone,business_info}는 모든 vertical 스키마에
 * 공통으로 존재하므로 vertical 분기 없이 그대로 동작한다.
 */
export default async function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  if (!site) notFound();

  const content = site.content_json as { meta: LegalMeta; blocks: { info: LegalInfo } };
  const { terms, privacy } = buildLegalDocuments({ meta: content.meta, info: content.blocks.info });

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
