"use client";

import type { Info, Topbar as TopbarType } from "@/lib/content-types";
import { resolveCtaHref } from "@/lib/cta";
import { useImageFallback } from "@/lib/useImageFallback";
import { CtaButton } from "../shared/CtaButton";
import styles from "./Topbar.module.css";

export function Topbar({
  topbar,
  logoUrl,
  info,
}: {
  topbar: TopbarType;
  logoUrl: string | null;
  info: Info;
}) {
  const { ref, showImage, onError } = useImageFallback(logoUrl);

  return (
    <header className={styles.bar}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={logoUrl!}
          alt={topbar.display_name}
          className={styles.logoImg}
          onError={onError}
        />
      ) : (
        <span className={styles.logotype}>{topbar.display_name}</span>
      )}
      <CtaButton
        href={resolveCtaHref(topbar.action_button.type, info)}
        label={topbar.action_button.label}
        size="sm"
      />
    </header>
  );
}
