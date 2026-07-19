import type { Atmosphere as AtmosphereType } from "@/lib/content-types-boutique-fitness";
import styles from "./Atmosphere.module.css";

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
