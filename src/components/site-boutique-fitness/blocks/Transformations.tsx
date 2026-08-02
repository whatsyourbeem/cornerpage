"use client";

import { useCallback, useEffect, useRef } from "react";
import { ChevronsLeftRight } from "lucide-react";
import type { Transformations as TransformationsType } from "@/lib/content-types-boutique-fitness";
import { useImageFallback } from "@/lib/useImageFallback";
import styles from "./Transformations.module.css";

function SliderImage({ src, alt }: { src: string; alt: string }) {
  const { ref, showImage, onError } = useImageFallback(src);
  if (!showImage) {
    return <div className={`${styles.fallback} mhp-dot-texture`} role="img" aria-label={alt} />;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={styles.image}
      onError={onError}
      draggable={false}
    />
  );
}

// 첫 노출 시 한 번만 좌우로 살짝 흔들어 "이거 드래그되는 거예요"를 알려주는 인트로 웨이브포인트.
// [진행률(0~1), 위치(%)] — 가운데(50)에서 왼쪽으로 살짝, 오른쪽으로 살짝, 다시 가운데로.
const INTRO_WIGGLE_KEYFRAMES: [number, number][] = [
  [0, 50],
  [0.22, 38],
  [0.56, 64],
  [0.82, 46],
  [1, 50],
];
const INTRO_WIGGLE_DURATION = 1100;

function easeInOutQuad(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function sampleWiggle(progress: number): number {
  let i = 0;
  while (i < INTRO_WIGGLE_KEYFRAMES.length - 2 && progress > INTRO_WIGGLE_KEYFRAMES[i + 1][0]) {
    i += 1;
  }
  const [t0, v0] = INTRO_WIGGLE_KEYFRAMES[i];
  const [t1, v1] = INTRO_WIGGLE_KEYFRAMES[i + 1];
  const segmentT = t1 === t0 ? 1 : (progress - t0) / (t1 - t0);
  return v0 + (v1 - v0) * easeInOutQuad(Math.min(1, Math.max(0, segmentT)));
}

/**
 * design-guide.md components: before-after-slider — 이 vertical의 시그니처 인터랙션.
 * 좌우 드래그(포인터 이벤트라 마우스/터치 공통)로 비포/애프터를 비교한다.
 *
 * position을 React state로 두고 CSS transition으로 따라가게 했더니, 손가락/마우스보다
 * 화면이 한 박자 늦게 쫓아와 "느리고 끊긴다"는 피드백이 있었다 — 매 pointermove마다
 * 리렌더 + 150ms 트랜지션이 겹쳐 누적 지연이 생긴 것. 지금은 state를 거치지 않고
 * ref로 DOM(clip-path/left)을 rAF 한 프레임에 한 번만 직접 갱신해 입력과 1:1로
 * 붙어 따라가게 한다. 모바일에서 살짝만 비스듬히 드래그해도 세로 스크롤로 새던 문제는
 * touch-action: none(module.css)으로 이 슬라이더 위에서 브라우저의 세로 스크롤 제스처
 * 인식 자체를 꺼서 해결한다.
 *
 * 뷰포트에 처음 들어올 때 한 번, 드래그 가능하다는 걸 알려주는 좌우 웨이브 애니메이션을
 * 튼다(사용자 요청) — 실제 드래그와 동일한 applyPosition 경로를 그대로 재사용해 끊김 없이
 * 이어지고, 사용자가 애니메이션 도중 바로 잡아끌면 즉시 취소하고 드래그로 넘어간다.
 */
function BeforeAfterSlider({ beforeUrl, afterUrl }: { beforeUrl: string; afterUrl: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const beforeLayerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const pendingPctRef = useRef(50);
  const introRafRef = useRef<number | null>(null);

  const applyPosition = useCallback((pct: number) => {
    if (beforeLayerRef.current) {
      beforeLayerRef.current.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    }
    if (handleRef.current) {
      handleRef.current.style.left = `${pct}%`;
    }
  }, []);

  const cancelIntroWiggle = useCallback(() => {
    if (introRafRef.current != null) {
      cancelAnimationFrame(introRafRef.current);
      introRafRef.current = null;
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min(1, (now - start) / INTRO_WIGGLE_DURATION);
          applyPosition(sampleWiggle(progress));
          if (progress < 1) {
            introRafRef.current = requestAnimationFrame(tick);
          } else {
            introRafRef.current = null;
          }
        };
        introRafRef.current = requestAnimationFrame(tick);
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelIntroWiggle();
    };
  }, [applyPosition, cancelIntroWiggle]);

  const scheduleUpdate = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
      pendingPctRef.current = pct;
      if (rafRef.current != null) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        applyPosition(pendingPctRef.current);
      });
    },
    [applyPosition]
  );

  return (
    <div
      ref={containerRef}
      className={styles.slider}
      onPointerDown={(e) => {
        cancelIntroWiggle();
        draggingRef.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        scheduleUpdate(e.clientX);
      }}
      onPointerMove={(e) => {
        if (!draggingRef.current) return;
        scheduleUpdate(e.clientX);
      }}
      onPointerUp={() => {
        draggingRef.current = false;
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    >
      <div className={styles.layer}>
        <SliderImage src={afterUrl} alt="이후" />
        <span className={`${styles.tag} ${styles.tagAfter}`}>AFTER</span>
      </div>
      <div
        ref={beforeLayerRef}
        className={styles.layer}
        style={{ clipPath: "inset(0 50% 0 0)" }}
      >
        <SliderImage src={beforeUrl} alt="이전" />
        <span className={`${styles.tag} ${styles.tagBefore}`}>BEFORE</span>
      </div>
      <div ref={handleRef} className={styles.handle} style={{ left: "50%" }}>
        <span className={styles.handleGrip}>
          <ChevronsLeftRight className={styles.handleIcon} aria-hidden />
        </span>
      </div>
    </div>
  );
}

export function Transformations({ transformations }: { transformations: TransformationsType }) {
  return (
    <div className="mhp-band mhp-band-light-alt mhp-section">
      <div className="mhp-container">
        <h2 className="mhp-section-title">변화 사례</h2>
        <div className={styles.grid}>
          {transformations.items.map((item, i) => (
            <div className={styles.card} key={i}>
              <BeforeAfterSlider beforeUrl={item.before_image_url} afterUrl={item.after_image_url} />
              <div className={styles.caption}>
                <span className={styles.highlight}>{item.result_highlight}</span>
                <span className={styles.meta}>
                  {item.member_label} · {item.duration_label}
                  {item.trainer_tag && <span className={styles.tagCert}>{item.trainer_tag}</span>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
