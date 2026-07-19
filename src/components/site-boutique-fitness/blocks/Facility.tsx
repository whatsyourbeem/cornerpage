import type { Facility as FacilityType } from "@/lib/content-types-boutique-fitness";
import { SmartImage } from "@/components/site/shared/SmartImage";
import styles from "./Facility.module.css";

const CHECKS: { key: "has_shower" | "has_locker" | "has_parking"; label: string }[] = [
  { key: "has_shower", label: "샤워실" },
  { key: "has_locker", label: "개인 라커" },
  { key: "has_parking", label: "주차" },
];

export function Facility({ facility }: { facility: FacilityType }) {
  return (
    <div className="mhp-band mhp-band-light-alt mhp-section">
      <div className="mhp-container">
        <p className="mhp-eyebrow">시설 안내</p>
        {facility.photos && facility.photos.length > 0 && (
          <div className={styles.photos}>
            {facility.photos.map((src, i) => (
              <SmartImage key={src + i} src={src} alt="" className={styles.photo} />
            ))}
          </div>
        )}
        {facility.atmosphere_text && <p className={styles.atmosphereText}>{facility.atmosphere_text}</p>}
        <div className={styles.grid}>
          {facility.size_pyeong != null && (
            <div className={styles.stat}>
              <span className={styles.statValue}>{facility.size_pyeong}평</span>
              <span className={styles.statLabel}>공간 크기</span>
            </div>
          )}
          {CHECKS.map(({ key, label }) => {
            const value = facility[key];
            if (value == null) return null;
            return (
              <div className={styles.item} key={key}>
                <span className={value ? styles.iconYes : styles.iconNo} aria-hidden="true">
                  {value ? "✓" : "✕"}
                </span>
                <span>{label}</span>
              </div>
            );
          })}
        </div>
        {facility.equipment_list && facility.equipment_list.length > 0 && (
          <div className={styles.equipment}>
            <p className={styles.equipmentLabel}>보유 장비</p>
            <div className={styles.equipmentTags}>
              {facility.equipment_list.map((eq) => (
                <span className={styles.equipmentTag} key={eq}>
                  {eq}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
