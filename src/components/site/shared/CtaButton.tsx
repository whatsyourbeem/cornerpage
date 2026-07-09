import styles from "./CtaButton.module.css";

export function CtaButton({
  href,
  label,
  variant = "solid",
  size = "md",
}: {
  href: string;
  label: string;
  variant?: "solid" | "outline";
  size?: "md" | "sm";
}) {
  const className = [
    styles.button,
    variant === "outline" ? styles.outline : "",
    size === "sm" ? styles.small : "",
  ]
    .filter(Boolean)
    .join(" ");

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
