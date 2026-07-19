"use client";

import { useEffect } from "react";
import type { InquiryChannel } from "@/lib/content-types-boutique-fitness";
import { inquiryChannelHref, inquiryChannelLabel } from "@/lib/channels-boutique-fitness";
import { ChannelButton } from "./shared/ChannelButton";
import { useInquiryDialog } from "./DialogContext";
import styles from "./InquiryDialog.module.css";

/** design-guide.md components: inquiry-dialog — 이 vertical의 두 번째 시그니처 컴포넌트. */
export function InquiryDialog({ channels }: { channels: InquiryChannel[] }) {
  const { isOpen, closeDialog } = useInquiryDialog();

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, closeDialog]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={closeDialog}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <p className={styles.title}>문의하기</p>
          <button type="button" className={styles.close} onClick={closeDialog} aria-label="닫기">
            ✕
          </button>
        </div>
        <div className={styles.list}>
          {channels.map((channel, i) => (
            <ChannelButton
              key={channel.type + i}
              type={channel.type}
              label={inquiryChannelLabel(channel)}
              href={inquiryChannelHref(channel)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
