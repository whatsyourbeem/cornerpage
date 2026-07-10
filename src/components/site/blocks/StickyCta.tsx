import type { StickyCta as StickyCtaType } from "@/lib/content-types";
import { resolveStickyCtaHref } from "@/lib/cta";
import { CtaButton } from "../shared/CtaButton";
import styles from "./StickyCta.module.css";

export function StickyCta({ stickyCta }: { stickyCta: StickyCtaType }) {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        {stickyCta.buttons.map((button, i) => (
          <CtaButton
            key={button.type + i}
            href={resolveStickyCtaHref(button)}
            label={button.label}
            variant={i === 0 ? "solid" : "outline"}
          />
        ))}
      </div>
    </div>
  );
}
