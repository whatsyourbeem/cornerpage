import type { Philosophy as PhilosophyType } from "@/lib/content-types";
import styles from "./Philosophy.module.css";

/**
 * Manifesto 변형: about과 별도의 top-level 블록이라 배경 밴드 자체를 어둡게
 * 반전시켜(mhp-band-dark) about(mhp-band-light-alt)과 한눈에 구분되게 한다.
 * blocks.md 3-1 참고.
 */
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
