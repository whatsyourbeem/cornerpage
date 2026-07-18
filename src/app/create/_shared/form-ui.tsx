"use client";

import type { DayOfWeek } from "@/lib/content-types";

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

/**
 * 전역 CSS(Tailwind preflight)가 폼 요소에 appearance:none을 적용해서, 이 스타일
 * 없이는 <input type="file">의 네이티브 "파일 선택" 버튼이 아예 안 보인다(빈 공간만
 * 남음). 명시적으로 되돌리고, 항상 보이는 테두리 박스를 씌워 클릭 영역을 분명히 한다.
 */
export const fileInputStyle: React.CSSProperties = {
  appearance: "auto",
  display: "block",
  width: "100%",
  padding: "10px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 13,
};

export const fileNameStyle: React.CSSProperties = { fontSize: 12, color: "#666", marginTop: 4 };

export const navButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "14px 16px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "white",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

export const primaryButtonStyle: React.CSSProperties = {
  background: "#111",
  color: "white",
  border: "1px solid #111",
};

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{title}</h1>
      {children}
    </div>
  );
}

/**
 * hint: 선택 문항 옆에 붙이는 짧은 동기 문구(input-questions.md 진행 원칙 —
 * "강요·과장 없이 사실만 담백하게"). 채우면 왜 좋은지를 솔직하게 알려주되,
 * 채우지 않아도 되는 선택 사항이라는 톤은 유지한다.
 */
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      {hint && <span style={{ fontSize: 12, color: "#888" }}>{hint}</span>}
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {DAYS.map((d) => (
        <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <span style={{ width: 20, fontWeight: 700 }}>{d.label}</span>
          <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
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
              />
              <span>–</span>
              <input
                type="time"
                value={hours[d.key].close}
                onChange={(e) => onChange((prev) => ({ ...prev, [d.key]: { ...prev[d.key], close: e.target.value } }))}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/** 단계 번호 + 진행바. STEPS[0]("업종 선택")은 vertical 라우트 진입 전이라 이 컴포넌트가 관여하지 않는다. */
export function ProgressBar({ step, total, label }: { step: number; total: number; label: string }) {
  return (
    <>
      <p style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
        {step} / {total} · {label}
      </p>
      <div style={{ height: 4, background: "#eee", borderRadius: 2, marginBottom: 28 }}>
        <div
          style={{
            height: "100%",
            width: `${(step / total) * 100}%`,
            background: "#111",
            borderRadius: 2,
            transition: "width 0.2s",
          }}
        />
      </div>
    </>
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
    <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
      {step > 0 && (
        <button type="button" onClick={onBack} style={navButtonStyle}>
          이전
        </button>
      )}
      {!isLastStep ? (
        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          style={{ ...navButtonStyle, ...primaryButtonStyle, opacity: canProceed ? 1 : 0.4 }}
        >
          다음
        </button>
      ) : (
        <button type="button" onClick={onSubmit} style={{ ...navButtonStyle, ...primaryButtonStyle }}>
          이미지 업로드하고 요청 준비하기
        </button>
      )}
    </div>
  );
}
