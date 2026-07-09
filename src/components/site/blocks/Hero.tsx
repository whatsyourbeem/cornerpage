"use client";

import type { Hero as HeroType, Info } from "@/lib/content-types";
import { resolveCtaHref } from "@/lib/cta";
import { useImageFallback } from "@/lib/useImageFallback";
import { CtaButton } from "../shared/CtaButton";
import styles from "./Hero.module.css";

export function Hero({
  hero,
  info,
  toneSlug,
}: {
  hero: HeroType;
  info: Info;
  toneSlug: string;
}) {
  const { ref, showImage, onError } = useImageFallback(
    hero.background_image_url
  );

  return (
    <section className={styles.hero}>
      {showImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={ref}
            src={hero.background_image_url!}
            alt=""
            className={styles.bgImage}
            loading="eager"
            onError={onError}
          />
          <div className={styles.bgOverlay} />
        </>
      ) : (
        <div className={`${styles.bgFallback} mhp-dot-texture`} />
      )}

      <div className={styles.content}>
        <span className={styles.badge}>{hero.badge}</span>
        <h1 className={styles.headline}>{hero.headline}</h1>
        <p className={styles.tagline}>{hero.tagline}</p>
        <CtaButton
          href={resolveCtaHref(hero.cta.type, info)}
          label={hero.cta.label}
        />
      </div>

      {toneSlug === "warm" && (
        <svg
          className={styles.wavyDivider}
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 20 Q 50 40 100 20 T 200 20 T 300 20 T 400 20 V40 H0 Z"
            fill="var(--paper)"
          />
        </svg>
      )}
    </section>
  );
}
