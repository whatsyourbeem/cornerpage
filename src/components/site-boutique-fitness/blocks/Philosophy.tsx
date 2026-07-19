import type { Philosophy as PhilosophyType } from "@/lib/content-types-boutique-fitness";
import styles from "./Philosophy.module.css";

/** general의 Manifesto 변형과 동일한 패턴(mhp-band-dark) — 스튜디오 창립 계기로 범위가
 * 한정된다는 점만 다르다(개인 지도 철학은 professionals.bio_quote가 담당, content.types.ts 참고). */
export function Philosophy({ philosophy }: { philosophy: PhilosophyType }) {
  return (
    <div className="mhp-band mhp-band-dark mhp-section">
      <div className="mhp-container">
        <p className={styles.quoteMark} aria-hidden="true">
          &ldquo;
        </p>
        <p className={styles.text}>{philosophy.text}</p>
      </div>
    </div>
  );
}
