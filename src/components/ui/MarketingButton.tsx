import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

/**
 * toss.im 마케팅 서피스 CTA(docs/DESIGN.md §4). 홈(`/`) 화면에서만 쓴다 —
 * 앱 내부 화면(위저드·로그인·대시보드)은 TDS product 버튼(Button.tsx)을
 * 쓴다. 56px/16px 라디우스의 TDS 버튼과 40~46px/7px 라디우스의 마케팅
 * 버튼을 절대 섞지 않는다(§7 Don't, §8).
 */

export type MarketingButtonVariant = "primary" | "dark";

const VARIANT_STYLES: Record<MarketingButtonVariant, string> = {
  primary: "h-10 text-[15px] bg-cp-weak-bg text-cp-weak-fg hover:brightness-95",
  dark: "h-[46px] text-[17px] bg-[rgba(0,12,30,0.8)] text-white hover:bg-[rgba(0,12,30,0.9)]",
};

const SHARED =
  "inline-flex items-center justify-center gap-2 rounded-cp-marketing px-4 py-[11px] font-semibold whitespace-nowrap transition-colors active:scale-[0.98]";

interface CommonProps {
  variant?: MarketingButtonVariant;
  children: ReactNode;
  className?: string;
}

type LinkProps = CommonProps & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children">;
type ButtonProps = CommonProps & { href?: undefined } & Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "children"
  >;

export function MarketingButton(props: LinkProps | ButtonProps) {
  const { variant = "primary", children, className } = props;
  const classes = cx(SHARED, VARIANT_STYLES[variant], className);

  if (props.href) {
    // variant/children/className은 이미 위에서 읽었다 — DOM으로 안 새어나가게 rest에서만 뺀다.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { href, variant: _v, children: _c, className: _cn, ...anchorRest } = props;
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { variant: _v2, children: _c2, className: _cn2, href: _h, ...buttonRest } = props;
  return (
    <button type="button" className={classes} {...(buttonRest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {children}
    </button>
  );
}
