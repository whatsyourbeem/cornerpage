import type { Reviews as ReviewsType } from "@/lib/content-types-boutique-fitness";
import styles from "./Reviews.module.css";

export function Reviews({ reviews }: { reviews: ReviewsType }) {
  return (
    <div className="mhp-band mhp-band-light mhp-section">
      <div className="mhp-container">
        <h2 className="mhp-section-title">방문자 후기</h2>
        <div className={styles.list}>
          {reviews.items.map((review, i) => (
            <div className={styles.card} key={i}>
              {review.rating != null && (
                <div className={styles.stars} aria-label={`${review.rating}점`}>
                  {"★".repeat(review.rating)}
                  {"☆".repeat(Math.max(0, 5 - review.rating))}
                </div>
              )}
              <p className={styles.body}>&ldquo;{review.body}&rdquo;</p>
              <div className={styles.meta}>
                <span>{review.author}</span>
                {review.trainer_tag && <span className={styles.tag}>{review.trainer_tag}</span>}
                {review.source && <span>· {review.source}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
