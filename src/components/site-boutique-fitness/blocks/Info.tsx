import type { BrowseChannel, Info as InfoType } from "@/lib/content-types-boutique-fitness";
import { browseChannelHref, browseChannelLabel } from "@/lib/channels-boutique-fitness";
import { naverMapHref, telHref } from "@/lib/info-links-boutique-fitness";
import { dayLabel, formatHoursLine, sortStructuredHours } from "@/lib/hours-boutique-fitness";
import styles from "./Info.module.css";

export function Info({
  info,
  browseChannels,
}: {
  info: InfoType;
  browseChannels: BrowseChannel[] | null;
}) {
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
              href={naverMapHref(info.address)}
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
            <a className={styles.link} href={telHref(info.phone)}>
              {info.phone}
            </a>
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.rowLabel}>영업시간</span>
          <span className={styles.rowValue}>
            {info.hours.type === "24h" ? (
              "24시간 운영"
            ) : Array.isArray(info.hours.structured) && info.hours.structured.length > 0 ? (
              <span className={styles.hoursList}>
                {sortStructuredHours(info.hours.structured).map((entry) => (
                  <span className={styles.hoursLine} key={entry.day}>
                    <span className={styles.hoursDay}>{dayLabel(entry.day)}</span>
                    <span>{formatHoursLine(entry)}</span>
                  </span>
                ))}
              </span>
            ) : (
              "영업시간 문의"
            )}
          </span>
        </div>

        {browseChannels && browseChannels.length > 0 && (
          <div className={styles.row}>
            <span className={styles.rowLabel}>링크</span>
            <span className={styles.externalLinks}>
              {browseChannels.map((channel, i) => (
                <a
                  key={channel.type + i}
                  href={browseChannelHref(channel)}
                  className={styles.externalLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {browseChannelLabel(channel)}
                </a>
              ))}
            </span>
          </div>
        )}

        {info.business_info && (
          <div className={styles.businessInfo}>
            {info.business_info.registered_name} · 대표 {info.business_info.ceo_name} ·
            사업자등록번호 {info.business_info.registration_number}
          </div>
        )}
      </div>
    </div>
  );
}
