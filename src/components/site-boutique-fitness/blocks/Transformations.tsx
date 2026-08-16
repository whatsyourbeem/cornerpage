"use client";

import type { Transformations as TransformationsType } from "@/lib/content-types-boutique-fitness";
import { useImageFallback } from "@/lib/useImageFallback";
import styles from "./Transformations.module.css";

function TransformationImage({ src, alt }: { src: string; alt: string }) {
  const { ref, showImage, onError } = useImageFallback(src);
  if (!showImage) {
    return <div className={`${styles.fallback} mhp-dot-texture`} role="img" aria-label={alt} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img ref={ref} src={src} alt={alt} className={styles.image} onError={onError} />
  );
}

export function Transformations({ transformations }: { transformations: TransformationsType }) {
  return (
    <div className="mhp-band mhp-band-light-alt mhp-section">
      <div className="mhp-container">
        <h2 className="mhp-section-title">변화 사례</h2>
        <div className={styles.grid}>
          {transformations.items.map((item, i) => (
            <div className={styles.card} key={i}>
              <div className={styles.imageWrap}>
                <TransformationImage src={item.before_after_image_url} alt={`${item.member_label} 변화 사례`} />
              </div>
              <div className={styles.caption}>
                <span className={styles.highlight}>{item.result_highlight}</span>
                <span className={styles.meta}>
                  {item.member_label} · {item.duration_label}
                  {item.trainer_tag && <span className={styles.tagCert}>{item.trainer_tag}</span>}
                </span>
              </div>
              {item.description && <p className={styles.description}>{item.description}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
