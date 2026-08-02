"use client";

import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cx } from "./cx";

/** 확장(extension) — DESIGN.md 미검증. TextField(box) 지오메트리를 그대로 옮긴 select. */

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  label: string;
  help?: string;
  error?: string;
  containerClassName?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField(
  { label, help, error, containerClassName, id, disabled, children, ...rest },
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
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={cx(helpId, errorId) || undefined}
          className={cx(
            "h-11 w-full appearance-none rounded-cp-md border bg-cp-canvas px-3.5 pr-9 text-[15px] text-cp-fg outline-none transition-colors",
            "disabled:cursor-not-allowed disabled:bg-cp-surface disabled:text-cp-muted",
            error ? "border-cp-danger" : "border-cp-border focus:border-cp-primary"
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cp-muted"
          aria-hidden
        />
      </div>
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
