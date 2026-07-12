import type { About as AboutType } from "@/lib/content-types";
import { SmartImage } from "../shared/SmartImage";
import styles from "./About.module.css";

export function About({ about }: { about: AboutType }) {
  return (
    <div className="mhp-band mhp-band-light-alt mhp-section">
      <div className="mhp-container">
        <p className="mhp-eyebrow">이 가게 이야기</p>
        {about.supporting_image_url && (
          <SmartImage
            src={about.supporting_image_url}
            alt=""
            className={styles.image}
          />
        )}
        {about.body && <p className={styles.body}>{about.body}</p>}
        {about.philosophy && (
          <p className={styles.philosophy}>{about.philosophy}</p>
        )}
        {about.atmosphere && (
          <p className={styles.atmosphere}>{about.atmosphere}</p>
        )}
        {about.signature_quote && (
          <blockquote className={styles.quote}>
            &ldquo;{about.signature_quote}&rdquo;
          </blockquote>
        )}
      </div>
    </div>
  );
}
