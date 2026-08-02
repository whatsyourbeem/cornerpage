import type { ReactNode } from "react";
import { cx } from "./cx";

/**
 * 확장(extension) — DESIGN.md 미검증. §6 "No canonical shadow token... use
 * flat color layering"에 따라 그림자 없이 면 채우기(surface) 또는 1px 선
 * (outline)만으로 구분한다.
 */

export function Panel({
  tone = "outline",
  className,
  children,
}: {
  tone?: "surface" | "outline";
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx(
        "rounded-cp-btn-lg p-4",
        tone === "surface" ? "bg-cp-surface" : "border border-cp-border bg-cp-canvas",
        className
      )}
    >
      {children}
    </div>
  );
}
