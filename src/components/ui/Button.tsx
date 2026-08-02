"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cx } from "./cx";

/**
 * TDS Mobile product 버튼(docs/DESIGN.md §4). toss.im 마케팅 버튼과는 별도
 * 컴포넌트(MarketingButton)로 분리해뒀다 — 두 서피스의 radius/height를
 * 섞지 않기 위해서(§7 Don't: 16px TDS radius와 7px 마케팅 radius를 평균내지
 * 말 것). /create 위저드·로그인·대시보드 등 앱 내부 화면에서만 쓴다.
 */

export type ButtonVariant = "primary" | "weak" | "light" | "outline" | "dark" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px] rounded-cp-btn-sm gap-1.5",
  md: "h-[38px] px-4 text-sm rounded-cp-btn-md gap-1.5",
  lg: "h-12 px-5 text-[15px] rounded-cp-btn-lg gap-2",
  xl: "h-14 px-5 text-[17px] rounded-cp-btn-xl gap-2",
};

/**
 * dark/light 변형의 정확한 색상값은 DESIGN.md가 product 서피스로 검증하지
 * 않았다(§4는 fill/weak, primary/danger/light/dark라는 "상태 존재"만 문서화) —
 * 여기 값은 cp- 토큰으로 구성한 로컬 확장이다.
 */
const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-cp-primary text-cp-on-primary hover:bg-cp-primary-hover active:bg-cp-primary-hover",
  weak: "bg-cp-weak-bg text-cp-weak-fg hover:brightness-95 active:brightness-90",
  light: "bg-cp-surface text-cp-fg hover:brightness-95 active:brightness-90",
  outline: "bg-cp-canvas text-cp-fg border border-cp-border hover:bg-cp-surface active:bg-cp-surface",
  dark: "bg-cp-fg text-cp-canvas hover:brightness-110 active:brightness-125",
  danger: "bg-cp-danger text-white hover:brightness-95 active:brightness-90",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "xl", loading = false, fullWidth = false, disabled, className, children, ...rest },
  ref
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type="button"
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cx(
        "relative inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        !isDisabled && "cursor-pointer active:scale-[0.98]",
        fullWidth && "w-full",
        SIZE_STYLES[size],
        VARIANT_STYLES[variant],
        className
      )}
      {...rest}
    >
      {/* 로딩 중에도 버튼 폭이 유지되도록(§4) 라벨을 지우지 않고 투명 처리만 한다. */}
      <span className={cx("inline-flex items-center", loading && "invisible")}>{children}</span>
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-[1.1em] w-[1.1em] animate-spin" aria-hidden />
        </span>
      )}
    </button>
  );
});
