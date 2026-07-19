"use client";

import { useEffect, useRef, useState } from "react";
import {
  Award,
  BadgeCheck,
  Calendar,
  Clock,
  Dumbbell,
  Heart,
  MessagesSquare,
  RefreshCw,
  Star,
  TrendingUp,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  TrustStrip as TrustStripType,
  TrustStripIcon,
} from "@/lib/content-types-boutique-fitness";
import styles from "./TrustStrip.module.css";

const TRUST_STRIP_ICONS: Record<TrustStripIcon, LucideIcon> = {
  Calendar,
  Clock,
  Users,
  Award,
  BadgeCheck,
  TrendingUp,
  RefreshCw,
  Heart,
  Star,
  Dumbbell,
  MessagesSquare,
  Trophy,
};

/** "1,240+" -> { prefix: "", number: 1240, suffix: "+" } / 파싱 불가면 null */
function parseNumeric(value: string) {
  const match = value.match(/^(\D*)([\d,]+(?:\.\d+)?)(\D*)$/);
  if (!match) return null;
  const [, prefix, numStr, suffix] = match;
  const number = parseFloat(numStr.replace(/,/g, ""));
  if (Number.isNaN(number)) return null;
  const decimals = numStr.includes(".") ? numStr.split(".")[1].length : 0;
  return { prefix, number, suffix, decimals, hasComma: numStr.includes(",") };
}

function formatNumber(n: number, decimals: number, hasComma: boolean) {
  const fixed = n.toFixed(decimals);
  return hasComma
    ? Number(fixed).toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : fixed;
}

/** design-guide.md 7장: 뷰포트 진입 시 1회 카운트업(800ms) — 이 vertical은 톤 분기 없이 항상 적용. */
function CountUpValue({ value }: { value: string }) {
  const parsed = parseNumeric(value);
  const [display, setDisplay] = useState(parsed ? "0" : value);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!parsed || !ref.current) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setDisplay(value);
      return;
    }

    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const start = performance.now();
        const duration = 800;
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(
            `${parsed.prefix}${formatNumber(
              parsed.number * eased,
              parsed.decimals,
              parsed.hasComma
            )}${parsed.suffix}`
          );
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span ref={ref}>{display}</span>;
}

/** 아이콘도 카운트업과 같은 타이밍(뷰포트 진입 시 1회)에 등장 애니메이션을 튼다. */
function RevealIcon({ icon: Icon }: { icon: LucideIcon }) {
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setRevealed(true);
      return;
    }

    const el = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setRevealed(true);
        observer.disconnect();
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span ref={ref} className={`${styles.iconWrap} ${revealed ? styles.iconRevealed : ""}`}>
      <Icon className={styles.icon} aria-hidden />
    </span>
  );
}

export function TrustStrip({ trustStrip }: { trustStrip: TrustStripType }) {
  return (
    <div className="mhp-band mhp-band-light mhp-section">
      <div className={`mhp-container ${styles.strip}`}>
        {trustStrip.items.map((item, i) => {
          const Icon = TRUST_STRIP_ICONS[item.icon];
          return (
            <div className={styles.item} key={i}>
              {Icon && <RevealIcon icon={Icon} />}
              <span className={styles.value}>
                <CountUpValue value={item.value} />
              </span>
              <span className={styles.label}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
