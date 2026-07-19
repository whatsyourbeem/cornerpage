"use client";

import { useEffect, useRef } from "react";
import styles from "./KakaoMap.module.css";

/** 카카오맵 JS SDK 타입 패키지가 없어서, 이 컴포넌트가 실제로 쓰는 API만 최소로 선언한다. */
interface KakaoMapsNamespace {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => unknown;
  Map: new (container: HTMLElement, options: { center: unknown; level: number }) => {
    setDraggable(draggable: boolean): void;
    setZoomable(zoomable: boolean): void;
  };
  CustomOverlay: new (options: {
    map: unknown;
    position: unknown;
    content: HTMLElement;
    yAnchor: number;
  }) => unknown;
}

declare global {
  interface Window {
    kakao: { maps: KakaoMapsNamespace };
  }
}

const SDK_SRC = "https://dapi.kakao.com/v2/maps/sdk.js";

/** SDK 스크립트를 페이지당 한 번만 로드하고, 이미 로드된 경우 즉시 resolve한다. */
function loadKakaoSdk(appkey: string): Promise<void> {
  if (window.kakao?.maps) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>(`script[src^="${SDK_SRC}"]`);
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => window.kakao.maps.load(resolve), { once: true });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `${SDK_SRC}?appkey=${appkey}&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(resolve);
    document.head.appendChild(script);
  });
}

/**
 * design-guide.md: 지도 핀 색상은 --accent여야 하는데, 카카오맵 기본 마커는 고정된
 * 빨간 핀이라 색을 못 바꾼다. CustomOverlay로 순수 DOM(SVG)을 얹으면 우리 CSS
 * 변수를 그대로 쓸 수 있어서 이 방식으로 색상 요구사항을 만족시킨다.
 */
export function KakaoMap({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const appkey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
    if (!appkey || !containerRef.current) return;

    let cancelled = false;

    loadKakaoSdk(appkey).then(() => {
      if (cancelled || !containerRef.current) return;
      const { kakao } = window;
      const center = new kakao.maps.LatLng(lat, lng);
      const map = new kakao.maps.Map(containerRef.current, { center, level: 4 });
      map.setDraggable(false);
      map.setZoomable(false);

      const pinEl = document.createElement("div");
      pinEl.className = styles.pin;
      pinEl.innerHTML = `
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 11.5 7.3 11.77a1 1 0 0 0 1.4 0C13 21.5 20 15.25 20 10c0-4.42-3.58-8-8-8z" fill="currentColor"/>
          <circle cx="12" cy="10" r="3" fill="white"/>
        </svg>
      `;
      new kakao.maps.CustomOverlay({
        map,
        position: center,
        content: pinEl,
        yAnchor: 1,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [lat, lng]);

  return <div ref={containerRef} className={styles.map} />;
}
