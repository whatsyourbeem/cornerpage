import { cx } from "./cx";

/** 확장(extension) — DESIGN.md 미검증. 위저드 진행 표시(세그먼트 바 + 현재 단계 라벨). */

export function Stepper({
  step,
  total,
  label,
}: {
  /** 1-based 현재 단계 번호. */
  step: number;
  total: number;
  label: string;
}) {
  return (
    <div
      role="progressbar"
      aria-valuenow={step}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={label}
      className="flex flex-col gap-2"
    >
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold text-cp-muted">
          {step} / {total}
        </p>
        <p className="text-[13px] font-semibold text-cp-fg">{label}</p>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cx("h-1 flex-1 rounded-full transition-colors", i < step ? "bg-cp-primary" : "bg-cp-surface")}
          />
        ))}
      </div>
    </div>
  );
}
