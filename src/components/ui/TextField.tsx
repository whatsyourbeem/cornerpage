"use client";

import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { cx } from "./cx";

/**
 * TDS Mobile TextField(docs/DESIGN.md §4) — box/line 변형, focus/error/
 * disabled/readOnly 상태를 문서화된 대로 구현한다. label·help·error를
 * 필드에 묶어서 항상 같은 구조로 렌더링한다(라벨 없는 필드가 없게).
 */

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> {
  label: string;
  help?: string;
  error?: string;
  variant?: "box" | "line";
  containerClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, help, error, variant = "box", containerClassName, id, disabled, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helpId = help ? `${inputId}-help` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", containerClassName)}>
      <label htmlFor={inputId} className="text-sm font-semibold text-cp-fg">
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        aria-describedby={cx(helpId, errorId) || undefined}
        className={cx(
          "h-11 w-full px-3.5 text-[15px] text-cp-fg outline-none transition-colors placeholder:text-cp-muted",
          "disabled:cursor-not-allowed disabled:bg-cp-surface disabled:text-cp-muted",
          variant === "box" &&
            cx(
              "rounded-cp-md border bg-cp-canvas",
              error ? "border-cp-danger" : "border-cp-border focus:border-cp-primary"
            ),
          variant === "line" &&
            cx(
              "border-b bg-transparent px-0",
              error ? "border-cp-danger" : "border-cp-border focus:border-cp-primary"
            )
        )}
        {...rest}
      />
      {error ? (
        <p id={errorId} className="text-[13px] text-cp-danger">
          {error}
        </p>
      ) : help ? (
        <p id={helpId} className="text-[13px] text-cp-muted">
          {help}
        </p>
      ) : null}
    </div>
  );
});
