import type { Atmosphere as AtmosphereType } from "@/lib/content-types";
import styles from "./Atmosphere.module.css";

/**
 * about과 독립된 top-level 블록. philosophy(Manifesto, 어두운 배경·큰 헤드라인)
 * 만큼 강조하지 않되, about(밝은 본문 문단)과는 다르게 이탤릭 톤으로 구분한다.
 * blocks.md 3-2 참고.
 */
export function Atmosphere({ atmosphere }: { atmosphere: AtmosphereType }) {
  return (
    <div className="mhp-band mhp-band-light mhp-section">
      <div className="mhp-container">
        <p className="mhp-eyebrow">ATMOSPHERE</p>
        <p className={styles.text}>{atmosphere.text}</p>
      </div>
    </div>
  );
}
