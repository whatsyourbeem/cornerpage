"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { LayoutSlug, ToneSlug } from "@/lib/tone";

const TONES: { slug: ToneSlug; label: string }[] = [
  { slug: "warm", label: "감성형" },
  { slug: "trust", label: "신뢰형" },
  { slug: "driven", label: "혼합형" },
];

const LAYOUTS: { slug: LayoutSlug; label: string }[] = [
  { slug: "gallery", label: "갤러리우선" },
  { slug: "menu", label: "메뉴우선" },
  { slug: "none", label: "해당없음" },
];

const BRAND_PRESETS: { hex: string; label: string }[] = [
  { hex: "#4A9FD8", label: "블루" },
  { hex: "#E0468E", label: "핑크" },
  { hex: "#5B3FA0", label: "퍼플" },
  { hex: "#F4D35E", label: "라이트옐로우(대비보정 확인용)" },
];

export function ToneSwitcher({
  activeTone,
  activeLayout,
  activeBrand,
}: {
  activeTone: ToneSlug;
  activeLayout: LayoutSlug;
  activeBrand: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setParam = (key: "tone" | "layout" | "brand", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const pillStyle = (active: boolean, bg?: string) => ({
    padding: "4px 8px",
    borderRadius: 6,
    border: active ? "1.5px solid white" : "1.5px solid transparent",
    cursor: "pointer",
    fontWeight: 700,
    background: bg ?? (active ? "white" : "rgba(255,255,255,0.15)"),
    color: bg ? "white" : active ? "black" : "white",
    textShadow: bg ? "0 1px 2px rgba(0,0,0,0.6)" : "none",
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 72,
        right: 8,
        zIndex: 999,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        background: "rgba(20,20,20,0.85)",
        borderRadius: 10,
        padding: 8,
        fontSize: 11,
        maxWidth: 220,
      }}
    >
      <div style={{ display: "flex", gap: 4 }}>
        {TONES.map((t) => (
          <button
            key={t.slug}
            onClick={() => setParam("tone", t.slug)}
            style={pillStyle(activeTone === t.slug)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4 }}>
        {LAYOUTS.map((l) => (
          <button
            key={l.slug}
            onClick={() => setParam("layout", l.slug)}
            style={pillStyle(activeLayout === l.slug)}
          >
            {l.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
        <button
          onClick={() => setParam("brand", "off")}
          style={pillStyle(activeBrand === null)}
        >
          브랜드컬러 off
        </button>
        {BRAND_PRESETS.map((b) => (
          <button
            key={b.hex}
            title={b.label}
            onClick={() => setParam("brand", b.hex)}
            style={pillStyle(activeBrand === b.hex, b.hex)}
          >
            {b.hex}
          </button>
        ))}
      </div>
    </div>
  );
}
