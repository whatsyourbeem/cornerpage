import type { About as AboutType } from "@/lib/content-types";
import { SmartImage } from "../shared/SmartImage";
import styles from "./About.module.css";

export function About({ about }: { about: AboutType }) {
  return (
    <div className="mhp-container mhp-section">
      <p className="mhp-eyebrow">이 가게 이야기</p>
      {about.supporting_image_url && (
        <SmartImage
          src={about.supporting_image_url}
          alt=""
          className={styles.image}
        />
      )}
      {about.body && <p className={styles.body}>{about.body}</p>}
      {about.signature_quote && (
        <blockquote className={styles.quote}>
          &ldquo;{about.signature_quote}&rdquo;
        </blockquote>
      )}
    </div>
  );
}
