import type { ExternalLinkPlatform, Info as InfoType } from "@/lib/content-types";
import { resolveCtaHref } from "@/lib/cta";
import { dayLabel, formatHoursLine, sortStructuredHours } from "@/lib/hours";
import styles from "./Info.module.css";

const PLATFORM_LABEL: Record<ExternalLinkPlatform, string> = {
  instagram: "인스타그램",
  kakao: "카카오",
  naver_reservation: "네이버예약",
  blog: "블로그",
};

export function Info({ info }: { info: InfoType }) {
  return (
    <div className="mhp-band mhp-band-dark mhp-section" id="info">
      <div className="mhp-container">
        <p className="mhp-eyebrow">오시는 길</p>

        <div className={styles.row}>
          <span className={styles.rowLabel}>주소</span>
          <span className={styles.rowValue}>
            {info.address}
            <br />
            <a
              className={styles.link}
              href={resolveCtaHref("direction", info)}
              target="_blank"
              rel="noopener noreferrer"
            >
              길찾기 →
            </a>
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>전화</span>
          <span className={styles.rowValue}>
            <a className={styles.link} href={resolveCtaHref("call", info)}>
              {info.phone}
            </a>
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>영업시간</span>
          <span className={styles.rowValue}>
            {info.hours.type === "24h" ? (
              "24시간 운영"
            ) : (
              <span className={styles.hoursList}>
                {sortStructuredHours(info.hours.structured).map((entry) => (
                  <span className={styles.hoursLine} key={entry.day}>
                    <span className={styles.hoursDay}>{dayLabel(entry.day)}</span>
                    <span>{formatHoursLine(entry)}</span>
                  </span>
                ))}
              </span>
            )}
          </span>
        </div>

        {info.external_links.length > 0 && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>링크</span>
            <span className={styles.externalLinks}>
              {info.external_links.map((link) => (
                <a
                  key={link.platform}
                  href={link.url}
                  className={styles.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {PLATFORM_LABEL[link.platform]}
                </a>
              ))}
            </span>
          </div>
        )}

        {info.business_info && (
          <div className={styles.businessInfo}>
            {info.business_info.registered_name} · 대표{" "}
            {info.business_info.ceo_name} · 사업자등록번호{" "}
            {info.business_info.registration_number}
          </div>
        )}
      </div>
    </div>
  );
}
