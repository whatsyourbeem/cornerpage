import type { Info, Menu as MenuType } from "@/lib/content-types";
import { resolveCtaHref } from "@/lib/cta";
import { SmartImage } from "../shared/SmartImage";
import styles from "./Menu.module.css";

function fullListHref(info: Info) {
  return info.external_links[0]?.url ?? resolveCtaHref("direction", info);
}

export function Menu({ menu, info }: { menu: MenuType; info: Info }) {
  const isTable = menu.mode === "package_table";

  return (
    <div className="mhp-band mhp-band-light mhp-section">
      <div className="mhp-container">
        <h2 className="mhp-section-title">{menu.label}</h2>

        {!isTable && <ItemList menu={menu} />}
        {isTable && (
          <div className={styles.categories}>
            {menu.categories.map((category) => (
              <div key={category.category_name}>
                <p className={styles.categoryName}>{category.category_name}</p>
                <div className={styles.tierTable}>
                  {category.tiers.map((tier, i) => (
                    <div
                      key={tier.label}
                      className={`${styles.tierRow} ${
                        i === category.representative_tier_index
                          ? styles.tierRepresentative
                          : ""
                      }`}
                    >
                      <span>
                        {tier.label}
                        {i === category.representative_tier_index && (
                          <span className={styles.tierRepBadge}>대표</span>
                        )}
                      </span>
                      <span>{tier.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {menu.full_list_link_enabled && (
          <a href={fullListHref(info)} className={styles.fullListHint}>
            더 보기 →
          </a>
        )}
      </div>
    </div>
  );
}

function ItemList({
  menu,
}: {
  menu: Extract<MenuType, { mode: "item_price" | "item_consult" }>;
}) {
  const allHaveImages = menu.items.every((item) => item.image_url);

  if (allHaveImages && menu.items.length > 0) {
    return (
      <div className={styles.cardGrid}>
        {menu.items.map((item) => (
          <div className={styles.card} key={item.name}>
            <SmartImage
              src={item.image_url!}
              alt={item.name}
              className={styles.cardImage}
            />
            <div className={styles.cardBody}>
              <div className={styles.itemHead}>
                <span className={styles.itemName}>{item.name}</span>
                {item.badge && (
                  <span className={styles.badge}>{item.badge}</span>
                )}
              </div>
              {item.description && (
                <p className={styles.itemDesc}>{item.description}</p>
              )}
              <div style={{ marginTop: 8 }}>
                {item.price ? (
                  <span className={styles.price}>{item.price}</span>
                ) : (
                  <span className={styles.priceConsult}>상담 문의</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {menu.items.map((item) => (
        <div className={styles.listRow} key={item.name}>
          <div>
            <div className={styles.itemHead}>
              <span className={styles.itemName}>{item.name}</span>
              {item.badge && (
                <span className={styles.badge}>{item.badge}</span>
              )}
            </div>
            {item.description && (
              <p className={styles.itemDesc}>{item.description}</p>
            )}
          </div>
          {item.price ? (
            <span className={styles.price}>{item.price}</span>
          ) : (
            <span className={styles.priceConsult}>상담 문의</span>
          )}
        </div>
      ))}
    </div>
  );
}
