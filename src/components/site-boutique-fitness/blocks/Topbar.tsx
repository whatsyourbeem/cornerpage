"use client";

import { useEffect, useState } from "react";
import type { Topbar as TopbarType } from "@/lib/content-types-boutique-fitness";
import { useImageFallback } from "@/lib/useImageFallback";
import { useInquiryDialog } from "../DialogContext";
import { Button } from "../shared/Button";
import styles from "./Topbar.module.css";

export function Topbar({ topbar, logoUrl }: { topbar: TopbarType; logoUrl: string | null }) {
  const { ref, showImage, onError } = useImageFallback(logoUrl);
  const { openDialog } = useInquiryDialog();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={[styles.bar, scrolled ? styles.scrolled : ""].filter(Boolean).join(" ")}>
      <div className={styles.inner}>
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
        <Button label={topbar.cta_label} onClick={openDialog} size="sm" />
      </div>
    </header>
  );
}
