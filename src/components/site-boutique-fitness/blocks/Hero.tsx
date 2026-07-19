"use client";

import type { BrowseChannel, Hero as HeroType } from "@/lib/content-types-boutique-fitness";
import { useImageFallback } from "@/lib/useImageFallback";
import { browseChannelHref, browseChannelLabel } from "@/lib/channels-boutique-fitness";
import { useInquiryDialog } from "../DialogContext";
import { Button } from "../shared/Button";
import { ChannelButton } from "../shared/ChannelButton";
import styles from "./Hero.module.css";

export function Hero({
  hero,
  browseChannels,
}: {
  hero: HeroType;
  browseChannels: BrowseChannel[] | null;
}) {
  const { ref, showImage, onError } = useImageFallback(hero.background_image_url);
  const { openDialog } = useInquiryDialog();

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
        <div className={styles.bgFallback} />
      )}

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
