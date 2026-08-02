"use client";

import { forwardRef, useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cx } from "./cx";

/** 확장(extension) — DESIGN.md 미검증. TextField의 box 지오메트리를 그대로 옮긴 멀티라인 입력. */

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label: string;
  help?: string;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, help, error, containerClassName, id, rows = 3, disabled, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const helpId = help ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={cx("flex flex-col gap-1.5", containerClassName)}>
      <label htmlFor={fieldId} className="text-sm font-semibold text-cp-fg">
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        aria-describedby={cx(helpId, errorId) || undefined}
        className={cx(
          "w-full resize-y rounded-cp-md border bg-cp-canvas px-3.5 py-2.5 text-[15px] text-cp-fg outline-none transition-colors placeholder:text-cp-muted",
          "disabled:cursor-not-allowed disabled:bg-cp-surface disabled:text-cp-muted",
          error ? "border-cp-danger" : "border-cp-border focus:border-cp-primary"
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
