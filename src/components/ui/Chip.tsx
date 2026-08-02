"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cx } from "./cx";

/** 확장(extension) — DESIGN.md 미검증. 강점·FAQ 후보 다중선택용 토글 칩. */

export function Chip({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cx(
        "inline-flex h-9 items-center gap-1 rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
        selected
          ? "border-cp-primary bg-cp-weak-bg text-cp-weak-fg"
          : "border-cp-border bg-cp-canvas text-cp-body hover:bg-cp-surface",
        className
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />}
      {children}
    </button>
  );
}
