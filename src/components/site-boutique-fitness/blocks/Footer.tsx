"use client";

import type { BrowseChannel, Info, Meta } from "@/lib/content-types-boutique-fitness";
import { useImageFallback } from "@/lib/useImageFallback";
import { browseChannelHref, browseChannelLabel } from "@/lib/channels-boutique-fitness";
import { ChannelIcon } from "../shared/ChannelIcon";
import styles from "./Footer.module.css";

/**
 * design-guide.md 10-6절: 새 콘텐츠 필드 없이 기존 값(logo_url·address·phone·business_info·
 * browse_channels)만 재조합한다. 이용약관·개인정보처리방침만 예외로 콘텐츠 JSON이 아니라
 * 고정 템플릿(legal-template.md → /site/[slug]/legal 라우트)에서 온다.
 */
export function Footer({
  meta,
  info,
  browseChannels,
}: {
  meta: Meta;
  info: Info;
  browseChannels: BrowseChannel[] | null;
}) {
  const { ref, showImage, onError } = useImageFallback(meta.logo_url);

  return (
    <footer className="mhp-band mhp-band-dark">
      <div className={`mhp-container ${styles.inner}`}>
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={ref}
            src={meta.logo_url!}
            alt={meta.business_name}
            className={styles.logoImg}
            onError={onError}
          />
        ) : (
          <span className={styles.logotype}>{meta.business_name}</span>
        )}

        <p className={styles.contact}>
          {info.address} · {info.phone}
        </p>

        {info.business_info && (
          <p className={styles.businessInfo}>
            {info.business_info.registered_name} · 대표 {info.business_info.ceo_name} ·
            사업자등록번호 {info.business_info.registration_number}
          </p>
        )}

        {browseChannels && browseChannels.length > 0 && (
          <div className={styles.socialRow}>
            {browseChannels.map((channel, i) => (
              <a
                key={channel.type + i}
                href={browseChannelHref(channel)}
                className={styles.socialLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={browseChannelLabel(channel)}
              >
                <ChannelIcon type={channel.type} className={styles.socialIcon} />
              </a>
            ))}
          </div>
        )}

        <div className={styles.legalRow}>
          <a href="/legal#terms" className={styles.legalLink}>
            이용약관
          </a>
          <a href="/legal#privacy" className={styles.legalLink}>
            개인정보처리방침
          </a>
        </div>
      </div>
    </footer>
  );
}
