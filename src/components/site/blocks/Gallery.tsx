import type { Gallery as GalleryType } from "@/lib/content-types";
import { SmartImage } from "../shared/SmartImage";
import styles from "./Gallery.module.css";

export function Gallery({ gallery }: { gallery: GalleryType }) {
  return (
    <div className="mhp-section">
      <div className={styles.label}>
        <p className="mhp-eyebrow">둘러보기</p>
      </div>
      <div className={styles.grid}>
        {gallery.images.map((src, i) => (
          <SmartImage key={src + i} src={src} alt="" className={styles.image} />
        ))}
      </div>
      {gallery.more_link_url && (
        <div className={styles.label}>
          <a
            href={gallery.more_link_url}
            className={styles.moreLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            사진 더 보기 →
          </a>
        </div>
      )}
    </div>
  );
}
