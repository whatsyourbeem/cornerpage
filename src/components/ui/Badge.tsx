import type { ReactNode } from "react";
import { cx } from "./cx";

/**
 * TDS Mobile Badge(docs/DESIGN.md §4) — fill/weak × xs~lg × semantic 색상.
 * §7 Don't: "badge를 액션 어포던스로 쓰지 말 것" — 클릭 핸들러를 받지 않는다.
 */

export type BadgeTone = "primary" | "neutral" | "danger";
export type BadgeVariant = "fill" | "weak";
export type BadgeSize = "xs" | "sm" | "md" | "lg";

const SIZE_STYLES: Record<BadgeSize, string> = {
  xs: "h-5 px-1.5 text-[11px]",
  sm: "h-6 px-2 text-[12px]",
  md: "h-7 px-2.5 text-[13px]",
  lg: "h-8 px-3 text-[14px]",
};

const TONE_STYLES: Record<BadgeVariant, Record<BadgeTone, string>> = {
  fill: {
    primary: "bg-cp-primary text-cp-on-primary",
    neutral: "bg-cp-muted text-cp-canvas",
    danger: "bg-cp-danger text-white",
  },
  weak: {
    primary: "bg-cp-weak-bg text-cp-weak-fg",
    neutral: "bg-cp-surface text-cp-body",
    danger: "bg-cp-danger/10 text-cp-danger",
  },
};

export function Badge({
  children,
  tone = "neutral",
  variant = "weak",
  size = "sm",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold",
        SIZE_STYLES[size],
        TONE_STYLES[variant][tone],
        className
      )}
    >
      {children}
    </span>
  );
}
