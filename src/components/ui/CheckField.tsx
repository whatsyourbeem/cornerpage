"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cx } from "./cx";

/**
 * TDS Mobile Agreement(docs/DESIGN.md §4)의 checked/unchecked/disabled 상태를
 * 따르는 체크박스. 네이티브 input은 sr-only로 숨기고 시각 요소를 직접
 * 그려서 브라우저마다 다른 네이티브 체크박스 모양 문제를 피한다.
 */

export interface CheckFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> {
  label: ReactNode;
  description?: string;
  containerClassName?: string;
}

export const CheckField = forwardRef<HTMLInputElement, CheckFieldProps>(function CheckField(
  { label, description, containerClassName, id, disabled, checked, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;

  return (
    <label
      htmlFor={fieldId}
      className={cx(
        "flex cursor-pointer items-start gap-2.5",
        disabled && "cursor-not-allowed opacity-50",
        containerClassName
      )}
    >
      <input ref={ref} id={fieldId} type="checkbox" disabled={disabled} checked={checked} className="sr-only peer" {...rest} />
      <span
        className={cx(
          "mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-cp-sm border transition-colors",
          checked ? "border-cp-primary bg-cp-primary" : "border-cp-border bg-cp-canvas",
          "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cp-primary"
        )}
        aria-hidden
      >
        {checked && <Check className="h-3.5 w-3.5 text-cp-on-primary" strokeWidth={3} />}
      </span>
      <span className="flex flex-col gap-0.5 text-[15px] text-cp-fg">
        <span>{label}</span>
        {description && <span className="text-[13px] text-cp-muted">{description}</span>}
      </span>
    </label>
  );
});
