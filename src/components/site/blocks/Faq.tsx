import type { Faq as FaqType } from "@/lib/content-types";
import styles from "./Faq.module.css";

export function Faq({ faq }: { faq: FaqType }) {
  return (
    <div className="mhp-container mhp-section">
      <p className="mhp-eyebrow">자주 묻는 질문</p>
      <div>
        {faq.items.map((item, i) => (
          <details className={styles.item} key={i}>
            <summary className={styles.question}>{item.question}</summary>
            <p className={styles.answer}>{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
