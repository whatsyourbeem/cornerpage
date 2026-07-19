import type { HowItWorks as HowItWorksType } from "@/lib/content-types-boutique-fitness";
import styles from "./HowItWorks.module.css";

export function HowItWorks({ howItWorks }: { howItWorks: HowItWorksType }) {
  const steps = [...howItWorks.steps].sort((a, b) => a.order - b.order);
  return (
    <div className="mhp-band mhp-band-light mhp-section">
      <div className="mhp-container">
        <p className="mhp-eyebrow">이용 방법</p>
        <div className={styles.steps}>
          {steps.map((step) => (
            <div className={styles.step} key={step.order}>
              <span className={styles.number}>{step.order}</span>
              <div>
                <p className={styles.title}>{step.title}</p>
                <p className={styles.desc}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
