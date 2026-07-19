import { ChannelIcon } from "./ChannelIcon";
import styles from "./ChannelButton.module.css";

/** design-guide.md components: channel-button. 다이얼로그 내부(md)와 히어로의 browse_channels
 * 행(sm) 양쪽에서 재사용한다. */
export function ChannelButton({
  type,
  label,
  href,
  size = "md",
}: {
  type: string;
  label: string;
  href: string;
  size?: "md" | "sm";
}) {
  const isExternal = href.startsWith("http");
  return (
    <a
      href={href}
      className={`${styles.button} ${size === "sm" ? styles.small : ""}`}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
    >
      <ChannelIcon type={type} className={styles.icon} />
      <span>{label}</span>
    </a>
  );
}
