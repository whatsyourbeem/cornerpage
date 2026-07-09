import type { Reviews as ReviewsType } from "@/lib/content-types";
import styles from "./Reviews.module.css";

export function Reviews({ reviews }: { reviews: ReviewsType }) {
  return (
    <div className="mhp-container mhp-section">
      <p className="mhp-eyebrow">방문자 후기</p>
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
              {review.source && <span>· {review.source}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
