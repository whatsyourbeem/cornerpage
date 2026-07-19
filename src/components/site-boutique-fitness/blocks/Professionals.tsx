import type { Professionals as ProfessionalsType } from "@/lib/content-types-boutique-fitness";
import { SmartImage } from "@/components/site/shared/SmartImage";
import styles from "./Professionals.module.css";

export function Professionals({ professionals }: { professionals: ProfessionalsType }) {
  return (
    <div className="mhp-band mhp-band-light-alt mhp-section">
      <div className="mhp-container">
        <h2 className="mhp-section-title">{professionals.section_label}</h2>
        <div className={styles.grid}>
          {professionals.items.map((person, i) => (
            <div className={styles.card} key={i}>
              <SmartImage src={person.photo_url ?? ""} alt={person.name} className={styles.photo} />
              <p className={styles.name}>{person.name}</p>
              <p className={styles.title}>{person.title}</p>
              {person.certifications.length > 0 && (
                <div className={styles.tags}>
                  {person.certifications.map((cert) => (
                    <span className={styles.tag} key={cert}>
                      {cert}
                    </span>
                  ))}
                </div>
              )}
              <p className={styles.bio}>{person.bio_quote}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
