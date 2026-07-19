"use client";

import { useRef, useState } from "react";
import type { Transformations as TransformationsType } from "@/lib/content-types-boutique-fitness";
import { useImageFallback } from "@/lib/useImageFallback";
import styles from "./Transformations.module.css";

function SliderImage({ src, alt }: { src: string; alt: string }) {
  const { ref, showImage, onError } = useImageFallback(src);
  if (!showImage) {
    return <div className={`${styles.fallback} mhp-dot-texture`} role="img" aria-label={alt} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={styles.image}
      onError={onError}
      draggable={false}
    />
  );
}

/** design-guide.md components: before-after-slider — 이 vertical의 시그니처 인터랙션.
 * 좌우 드래그(포인터 이벤트라 마우스/터치 공통)로 비포/애프터를 비교한다. 자동재생 없음. */
function BeforeAfterSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const updateFromClientX = (clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  };

  return (
    <div
      ref={containerRef}
      className={styles.slider}
      onPointerDown={(e) => {
        draggingRef.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        updateFromClientX(e.clientX);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
    >
      <div className={styles.layer}>
        <SliderImage src={afterUrl} alt="이후" />
        <span className={`${styles.tag} ${styles.tagAfter}`}>AFTER</span>
      </div>
      <div className={styles.layer} style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <SliderImage src={beforeUrl} alt="이전" />
        <span className={`${styles.tag} ${styles.tagBefore}`}>BEFORE</span>
      </div>
      <div className={styles.handle} style={{ left: `${position}%` }}>
        <span className={styles.handleGrip} />
      </div>
    </div>
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
              <BeforeAfterSlider beforeUrl={item.before_image_url} afterUrl={item.after_image_url} />
              <div className={styles.caption}>
                <span className={styles.highlight}>{item.result_highlight}</span>
                <span className={styles.meta}>
                  {item.member_label} · {item.duration_label}
                  {item.trainer_tag && <span className={styles.tagCert}>{item.trainer_tag}</span>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
