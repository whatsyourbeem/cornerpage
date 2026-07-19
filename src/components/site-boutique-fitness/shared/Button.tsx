import styles from "./Button.module.css";

/** design-guide.md components: button-primary / button-outline. onDark는 하단 고정 CTA바처럼
 * --brand-deep 배경 위에서 accent-on-dark로 대비를 확보해야 하는 자리 전용(10-4장). */
export function Button({
  label,
  onClick,
  href,
  variant = "primary",
  size = "md",
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "outline" | "onDark";
  size?: "sm" | "md";
}) {
  const className = [
    styles.button,
    variant === "outline" ? styles.outline : "",
    variant === "onDark" ? styles.onDark : "",
    size === "sm" ? styles.sm : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    const isExternal = href.startsWith("http");
    return (
      <a
        href={href}
        className={className}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {label}
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {label}
    </button>
  );
}
