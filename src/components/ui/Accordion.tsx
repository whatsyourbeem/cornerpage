"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "./cx";

/**
 * 확장(extension) — DESIGN.md 미검증. 선택 게이트 안 하위 섹션을 담는 다중
 * 개방형 접기/펼치기 카드. 하나를 열어도 다른 게 안 닫힌다 — 각 섹션이 서로
 * 완전히 독립적이어야 한다는 input-questions.md 게이트 설계 요구사항 때문.
 */
export function Accordion({
  title,
  hint,
  defaultOpen = false,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-cp-btn-lg border border-cp-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-bold text-cp-fg">{title}</span>
          {hint && <span className="text-[13px] font-normal text-cp-muted">{hint}</span>}
        </span>
        <ChevronDown
          className={cx("h-4 w-4 flex-none text-cp-muted transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && <div className="flex flex-col gap-4 border-t border-cp-border p-4">{children}</div>}
    </div>
  );
}
