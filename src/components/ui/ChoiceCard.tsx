"use client";

import type { ReactNode } from "react";
import { cx } from "./cx";

/** 확장(extension) — DESIGN.md 미검증. 라디오 성격의 큰 선택 카드. */

export function ChoiceCard({
  selected,
  onClick,
  title,
  description,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cx(
        "flex w-full flex-col gap-1 rounded-cp-btn-lg border-2 p-4 text-left transition-colors",
        selected ? "border-cp-primary bg-cp-weak-bg" : "border-cp-border bg-cp-canvas hover:bg-cp-surface",
        className
      )}
    >
      <span className={cx("text-[15px] font-bold", selected ? "text-cp-weak-fg" : "text-cp-fg")}>{title}</span>
      {description && <span className="text-[13px] text-cp-body">{description}</span>}
    </button>
  );
}
