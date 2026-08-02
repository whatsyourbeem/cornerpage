"use client";

import type { ReactNode } from "react";
import type { DayOfWeek } from "@/lib/content-types";
import { Button, Panel, Stepper } from "@/components/ui";

/** general·boutique-fitness 두 위저드가 공유하는 UI 조각·타입·스타일. */

export const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

export type DayHours = { open: string; close: string; closed: boolean };

export function defaultHours(): Record<DayOfWeek, DayHours> {
  return Object.fromEntries(
    DAYS.map((d) => [d.key, { open: "09:00", close: "21:00", closed: false }])
  ) as Record<DayOfWeek, DayHours>;
}

export interface FaqPairDraft {
  question: string;
  answer: string;
}


export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-cp-h3 font-bold text-cp-fg">{title}</h1>
      {children}
    </div>
  );
}

/**
 * hint: 선택 문항 옆에 붙이는 짧은 동기 문구(input-questions.md 진행 원칙 —
 * "강요·과장 없이 사실만 담백하게"). 채우면 왜 좋은지를 솔직하게 알려주되,
 * 채우지 않아도 되는 선택 사항이라는 톤은 유지한다.
 */
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[15px]">
      <span className="text-sm font-semibold text-cp-fg">{label}</span>
      {hint && <span className="text-[13px] text-cp-muted">{hint}</span>}
      {children}
    </label>
  );
}

export function HoursEditor({
  hours,
  onChange,
}: {
  hours: Record<DayOfWeek, DayHours>;
  onChange: (updater: (prev: Record<DayOfWeek, DayHours>) => Record<DayOfWeek, DayHours>) => void;
}) {
  function applyMondayToWeekdays() {
    const mon = hours.mon;
    onChange((prev) => {
      const next = { ...prev };
      (["tue", "wed", "thu", "fri"] as DayOfWeek[]).forEach((d) => {
        next[d] = { ...mon };
      });
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-1">
      {DAYS.map((d) => (
        <div key={d.key} className="flex min-h-11 flex-wrap items-center gap-2.5 text-[14px]">
          <span className="w-5 flex-none font-bold text-cp-fg">{d.label}</span>
          <label className="flex items-center gap-1.5 text-cp-body">
            <input
              type="checkbox"
              checked={hours[d.key].closed}
              onChange={(e) => onChange((prev) => ({ ...prev, [d.key]: { ...prev[d.key], closed: e.target.checked } }))}
            />
            휴무
          </label>
          {!hours[d.key].closed && (
            <>
              <input
                type="time"
                value={hours[d.key].open}
                onChange={(e) => onChange((prev) => ({ ...prev, [d.key]: { ...prev[d.key], open: e.target.value } }))}
                className="h-9 w-[124px] flex-none rounded-cp-sm border border-cp-border px-2 text-[13px] text-cp-fg outline-none focus:border-cp-primary"
              />
              <span className="text-cp-muted">–</span>
              <input
                type="time"
                value={hours[d.key].close}
                onChange={(e) => onChange((prev) => ({ ...prev, [d.key]: { ...prev[d.key], close: e.target.value } }))}
                className="h-9 w-[124px] flex-none rounded-cp-sm border border-cp-border px-2 text-[13px] text-cp-fg outline-none focus:border-cp-primary"
              />
            </>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={applyMondayToWeekdays}
        className="mt-1 self-start text-[13px] font-semibold text-cp-primary"
      >
        월요일 시간을 평일(화~금)에 일괄 적용
      </button>
    </div>
  );
}

/** 단계 번호 + 진행바. STEPS[0]("업종 선택")은 vertical 라우트 진입 전이라 이 컴포넌트가 관여하지 않는다. */
export function ProgressBar({ step, total, label }: { step: number; total: number; label: string }) {
  return <Stepper step={step} total={total} label={label} />;
}

/** 이전에 남겨둔 draft 복구 배너. 사진은 다시 첨부해야 한다는 점을 명시한다. */
export function DraftBanner({ onResume, onDiscard }: { onResume: () => void; onDiscard: () => void }) {
  return (
    <Panel tone="surface" className="mb-4 flex items-center justify-between gap-3">
      <span className="text-[13px] text-cp-body">
        이전에 작성하던 내용이 있어요. 이어서 작성할까요? (사진은 다시 첨부해주세요)
      </span>
      <div className="flex flex-shrink-0 gap-3">
        <button type="button" onClick={onResume} className="text-[13px] font-bold text-cp-primary">
          이어서 작성
        </button>
        <button type="button" onClick={onDiscard} className="text-[13px] text-cp-muted">
          새로 시작
        </button>
      </div>
    </Panel>
  );
}

/** 단계 내비게이션 바(이전/다음/제출). 마지막 단계에서는 onSubmit(수동 생성 흐름 시작 버튼)으로 바뀐다. */
export function WizardNav({
  step,
  isLastStep,
  canProceed,
  onBack,
  onNext,
  onSubmit,
}: {
  step: number;
  isLastStep: boolean;
  canProceed: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-8 flex gap-2 border-t border-cp-border bg-cp-canvas px-5 py-3">
      {step > 0 && (
        <Button variant="outline" size="xl" onClick={onBack}>
          이전
        </Button>
      )}
      {!isLastStep ? (
        <Button size="xl" className="flex-1" disabled={!canProceed} onClick={onNext}>
          다음
        </Button>
      ) : (
        <Button size="xl" className="flex-1" onClick={onSubmit}>
          이미지 업로드하고 요청 준비하기
        </Button>
      )}
    </div>
  );
}
