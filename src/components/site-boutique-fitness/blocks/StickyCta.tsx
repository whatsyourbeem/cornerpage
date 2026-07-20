"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import type { StickyCta as StickyCtaType } from "@/lib/content-types-boutique-fitness";
import { useInquiryDialog } from "../DialogContext";
import styles from "./StickyCta.module.css";

/**
 * design-guide.md 10-4절(2026-07-17): 화면 폭 전체 바에서 우측 하단 FAB로 전환.
 * 히어로(#hero)를 스크롤로 지나간 뒤부터 페이드인 — 히어로 CTA와 동시에 겹치지 않게.
 */
export function StickyCta({ stickyCta }: { stickyCta: StickyCtaType }) {
  const { openDialog } = useInquiryDialog();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      threshold: 0,
    });
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      className={`${styles.fab} ${visible ? styles.visible : ""}`}
      onClick={openDialog}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <MessageCircle className={styles.icon} aria-hidden />
      {stickyCta.cta_label}
    </button>
  );
}
