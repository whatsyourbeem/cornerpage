"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button, Panel, cx } from "@/components/ui";

/**
 * 블록 편집기가 공유하는 조각들. /create 위저드의 form-ui.tsx와 역할은 비슷하지만
 * 그쪽은 "처음 만들 때 한 번 훑는 단계형 폼"이고 여기는 "이미 있는 내용을 골라
 * 고치는 화면"이라 접기·추가/삭제·개수 제한 같은 요구가 달라서 따로 둔다.
 */

/** 접을 수 있는 블록 카드. 선택 블록이면 onToggle을 넘겨 사용 여부 스위치를 붙인다. */
export function BlockCard({
  title,
  description,
  enabled,
  onToggle,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  enabled?: boolean;
  onToggle?: (next: boolean) => void;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOptional = onToggle !== undefined;
  const isOn = !isOptional || enabled === true;

  return (
    <Panel tone="outline" className="p-0">
      <div className="flex items-center gap-2 px-4 py-3.5">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          disabled={!isOn}
          className="flex flex-1 items-center gap-2 text-left disabled:cursor-default"
          aria-expanded={open && isOn}
        >
          <span className="flex-1">
            <span className={cx("block text-[15px] font-bold", isOn ? "text-cp-fg" : "text-cp-muted")}>
              {title}
            </span>
            {description && <span className="mt-0.5 block text-[12px] text-cp-muted">{description}</span>}
          </span>
          {isOn && (
            <ChevronDown
              className={cx("h-4 w-4 flex-none text-cp-muted transition-transform", open && "rotate-180")}
              aria-hidden
            />
          )}
        </button>

        {isOptional && (
          <label className="flex flex-none items-center gap-1.5 text-[12px] font-semibold text-cp-body">
            <input
              type="checkbox"
              checked={isOn}
              onChange={(e) => {
                onToggle(e.target.checked);
                if (e.target.checked) setOpen(true);
              }}
            />
            사용
          </label>
        )}
      </div>

      {open && isOn && <div className="flex flex-col gap-4 border-t border-cp-border px-4 py-4">{children}</div>}
    </Panel>
  );
}

/** 라벨 + 도움말 + 입력 한 쌍. form-ui.tsx의 Field와 같은 역할이되 error를 받는다. */
export function EditorField({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold text-cp-fg">{label}</span>
      {hint && <span className="text-[12px] text-cp-muted">{hint}</span>}
      {children}
      {error && <span className="text-[12px] text-cp-danger">{error}</span>}
    </label>
  );
}

const INPUT_CLASS =
  "w-full rounded-cp-sm border border-cp-border bg-cp-canvas px-3 py-2.5 text-[14px] text-cp-fg outline-none placeholder:text-cp-muted focus:border-cp-primary";

export function TextInput({
  value,
  onChange,
  placeholder,
  invalid,
  ...rest
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  invalid?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      {...rest}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cx(INPUT_CLASS, invalid && "border-cp-danger focus:border-cp-danger")}
    />
  );
}

export function TextareaInput({
  value,
  onChange,
  placeholder,
  rows = 3,
  invalid,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  invalid?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={cx(INPUT_CLASS, "resize-y leading-relaxed", invalid && "border-cp-danger focus:border-cp-danger")}
    />
  );
}

export function SelectInput<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (next: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className={cx(INPUT_CLASS, "appearance-none")}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/**
 * 값이 없을 수 있는(null 허용) 텍스트 필드. 빈 문자열은 스키마상 minLength 위반이
 * 되는 자리가 많아서, 비우면 ""가 아니라 null로 내려보낸다.
 */
export function NullableTextInput({
  value,
  onChange,
  placeholder,
  multiline,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const handle = (next: string) => onChange(next.trim() === "" ? null : next);
  return multiline ? (
    <TextareaInput value={value ?? ""} onChange={handle} placeholder={placeholder} />
  ) : (
    <TextInput value={value ?? ""} onChange={handle} placeholder={placeholder} />
  );
}

/**
 * 있음/없음/미기재 3-state. facility의 has_shower·has_locker·has_parking은 boolean이
 * 아니라 boolean|null이다 — 체크박스로 만들면 "아직 안 적음"과 "없음"이 구분되지 않아
 * 미기재를 전부 "없음"으로 바꿔버린다.
 */
export function TriStateInput({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (next: boolean | null) => void;
}) {
  const options: { value: string; label: string }[] = [
    { value: "true", label: "있음" },
    { value: "false", label: "없음" },
    { value: "null", label: "미기재" },
  ];
  const current = value === null ? "null" : String(value);

  return (
    <div className="flex gap-1.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value === "null" ? null : option.value === "true")}
          className={cx(
            "h-9 flex-1 rounded-cp-sm border text-[13px] font-semibold transition-colors",
            current === option.value
              ? "border-cp-primary bg-cp-weak-bg text-cp-weak-fg"
              : "border-cp-border bg-cp-canvas text-cp-body hover:bg-cp-surface"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * 항목 추가·삭제·순서 이동이 있는 목록. min/max는 스키마의 minItems/maxItems를 그대로
 * 받아서 UI에서 먼저 막는다 — 저장 시점 ajv 에러로만 알려주면 사장님이 무엇을 어떻게
 * 고쳐야 하는지 알 수 없다.
 */
export function RepeatableList<T>({
  items,
  onChange,
  min = 0,
  max,
  itemLabel,
  createItem,
  renderItem,
}: {
  items: T[];
  onChange: (next: T[]) => void;
  min?: number;
  max?: number;
  itemLabel: string;
  createItem: () => T;
  renderItem: (item: T, index: number, onItemChange: (next: T) => void) => ReactNode;
}) {
  const canAdd = max === undefined || items.length < max;
  const canRemove = items.length > min;

  const replaceAt = (index: number, next: T) =>
    onChange(items.map((item, i) => (i === index ? next : item)));

  const removeAt = (index: number) => onChange(items.filter((_, i) => i !== index));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      {items.map((item, index) => (
        <div key={index} className="rounded-cp-md border border-cp-border bg-cp-canvas">
          <div className="flex items-center justify-between gap-2 border-b border-cp-border px-3 py-2">
            <span className="flex items-center gap-1.5 text-[12px] font-bold text-cp-body">
              <GripVertical className="h-3.5 w-3.5 text-cp-muted" aria-hidden />
              {itemLabel} {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="px-1.5 text-[12px] font-semibold text-cp-body disabled:text-cp-border"
                aria-label="위로"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                className="px-1.5 text-[12px] font-semibold text-cp-body disabled:text-cp-border"
                aria-label="아래로"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeAt(index)}
                disabled={!canRemove}
                className="px-1.5 text-cp-danger disabled:text-cp-border"
                aria-label={`${itemLabel} 삭제`}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3 px-3 py-3">
            {renderItem(item, index, (next) => replaceAt(index, next))}
          </div>
        </div>
      ))}

      {canAdd && (
        <Button variant="outline" size="md" onClick={() => onChange([...items, createItem()])}>
          <Plus className="h-4 w-4" aria-hidden />
          {itemLabel} 추가
        </Button>
      )}
      {!canAdd && max !== undefined && (
        <p className="text-[12px] text-cp-muted">최대 {max}개까지 넣을 수 있어요.</p>
      )}
    </div>
  );
}
