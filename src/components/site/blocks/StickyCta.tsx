import type { Info, StickyCta as StickyCtaType } from "@/lib/content-types";
import { resolveCtaHref } from "@/lib/cta";
import { CtaButton } from "../shared/CtaButton";
import styles from "./StickyCta.module.css";

export function StickyCta({
  stickyCta,
  info,
}: {
  stickyCta: StickyCtaType;
  info: Info;
}) {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        {stickyCta.buttons.map((button, i) => (
          <CtaButton
            key={button.type + i}
            href={resolveCtaHref(button.type, info)}
            label={button.label}
            variant={i === 0 ? "solid" : "outline"}
          />
        ))}
      </div>
    </div>
  );
}
