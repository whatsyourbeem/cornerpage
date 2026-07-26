"use client";

import type { ExternalLinkPlatform, Info, Meta } from "@/lib/content-types";
import { useImageFallback } from "@/lib/useImageFallback";
import { ChannelIcon } from "../shared/ChannelIcon";
import styles from "./Footer.module.css";

const PLATFORM_LABEL: Record<ExternalLinkPlatform, string> = {
  instagram: "인스타그램",
  kakao: "카카오",
  naver_reservation: "네이버예약",
  blog: "블로그",
};

export function Footer({ meta, info }: { meta: Meta; info: Info }) {
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

        {info.external_links.length > 0 && (
          <div className={styles.socialRow}>
            {info.external_links.map((link, i) => (
              <a
                key={link.platform + i}
                href={link.url}
                className={styles.socialLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={PLATFORM_LABEL[link.platform]}
              >
                <ChannelIcon type={link.platform} className={styles.socialIcon} />
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
