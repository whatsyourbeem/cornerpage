"use client";

import { useEffect, useState } from "react";
import type { BrowseChannel, Hero as HeroType } from "@/lib/content-types-boutique-fitness";
import { browseChannelHref, browseChannelLabel } from "@/lib/channels-boutique-fitness";
import { useInquiryDialog } from "../DialogContext";
import { Button } from "../shared/Button";
import { ChannelButton } from "../shared/ChannelButton";
import styles from "./Hero.module.css";

const SLIDE_INTERVAL_MS = 6000;

/** 여러 장이면 순서대로 크로스페이드 전환하며, 각 이미지엔 기존 bgDrift 팬·줌 애니메이션이 계속 돈다. */
function HeroBackground({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [images.length]);

  if (images.every((_, i) => failed[i])) {
    return <div className={styles.bgFallback} />;
  }

  return (
    <>
      {images.map((src, i) =>
        failed[i] ? null : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            className={styles.bgImage}
            style={{ opacity: i === index ? 1 : 0 }}
            loading={i === 0 ? "eager" : "lazy"}
            onError={() => setFailed((f) => ({ ...f, [i]: true }))}
          />
        )
      )}
      <div className={styles.bgOverlay} />
    </>
  );
}

export function Hero({
  hero,
  browseChannels,
}: {
  hero: HeroType;
  browseChannels: BrowseChannel[] | null;
}) {
  const { openDialog } = useInquiryDialog();
  const images = hero.background_images ?? [];

  return (
    <section className={styles.hero} id="hero">
      {images.length > 0 ? <HeroBackground images={images} /> : <div className={styles.bgFallback} />}

      <div className={styles.content}>
        <span className={styles.badge}>{hero.badge}</span>
        <h1 className={styles.headline}>{hero.headline}</h1>
        <p className={styles.tagline}>{hero.tagline}</p>
        <Button label={hero.cta_label} onClick={openDialog} />
        {browseChannels && browseChannels.length > 0 && (
          <div className={styles.browseRow}>
            {browseChannels.map((channel, i) => (
              <ChannelButton
                key={channel.type + i}
                type={channel.type}
                label={browseChannelLabel(channel)}
                href={browseChannelHref(channel)}
                size="sm"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
