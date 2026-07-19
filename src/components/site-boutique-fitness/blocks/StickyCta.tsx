"use client";

import type { StickyCta as StickyCtaType } from "@/lib/content-types-boutique-fitness";
import { useInquiryDialog } from "../DialogContext";
import { Button } from "../shared/Button";
import styles from "./StickyCta.module.css";

export function StickyCta({ stickyCta }: { stickyCta: StickyCtaType }) {
  const { openDialog } = useInquiryDialog();
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <Button label={stickyCta.cta_label} onClick={openDialog} variant="onDark" />
      </div>
    </div>
  );
}
