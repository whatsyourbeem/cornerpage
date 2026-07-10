"use client";

import { useState } from "react";
import type {
  AxisATone,
  AxisBLayout,
  CtaPrimaryAction,
} from "@/lib/content-types";

/**
 * 파이프라인 검증용 임시 폼(업로드 → API → DB → 렌더링). 실제 서비스의
 * 질문형 입력 UI는 이 자리를 나중에 대체한다 — 지금은 /api/sites가 실제
 * LLM 대신 목업 생성기를 쓰는 것과 마찬가지로, 최소 구성으로 배관만 검증한다.
 */

interface MenuItemDraft {
  name: string;
  price: string;
  description: string;
  file: File | null;
}

async function uploadImage(siteId: string, slot: string, file: File): Promise<string> {
  const form = new FormData();
  form.set("site_id", siteId);
  form.set("slot", slot);
  form.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) throw new Error(`이미지 업로드 실패(${slot})`);
  const data = await res.json();
  return data.url as string;
}

export default function CreatePage() {
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [tone, setTone] = useState<AxisATone>("감성형");
  const [layout, setLayout] = useState<AxisBLayout>("메뉴우선");
  const [ctaAction, setCtaAction] = useState<CtaPrimaryAction>("call");
  const [badge, setBadge] = useState("");
  const [headline, setHeadline] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [trustStrip, setTrustStrip] = useState([
    { value: "", label: "" },
    { value: "", label: "" },
    { value: "", label: "" },
  ]);
  const [menuLabel, setMenuLabel] = useState("대표 메뉴");
  const [menuItems, setMenuItems] = useState<MenuItemDraft[]>([
    { name: "", price: "", description: "", file: null },
  ]);

  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ slug: string } | null>(null);

  const addMenuItem = () =>
    setMenuItems((items) => [...items, { name: "", price: "", description: "", file: null }]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const draftRes = await fetch("/api/sites/draft", { method: "POST" });
      const { id } = (await draftRes.json()) as { id: string };

      const logoUrl = logoFile ? await uploadImage(id, "logo", logoFile) : null;
      const heroUrl = heroFile ? await uploadImage(id, "hero", heroFile) : null;
      const menuItemsWithUrls = await Promise.all(
        menuItems.map(async (item, i) => ({
          name: item.name,
          price: item.price,
          description: item.description,
          image_url: item.file ? await uploadImage(id, `menu-${i}`, item.file) : null,
        }))
      );

      const answers = {
        business_name: businessName,
        industry_category: industry,
        axis_a_tone: tone,
        axis_b_layout: layout,
        cta_primary_action: ctaAction,
        badge,
        headline,
        tagline,
        phone,
        address,
        menu_label: menuLabel,
        menu_items: menuItemsWithUrls,
        trust_strip_items: trustStrip as [
          { value: string; label: string },
          { value: string; label: string },
          { value: string; label: string },
        ],
        logo_url: logoUrl,
        hero_image_url: heroUrl,
      };

      const siteRes = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, answers }),
      });
      if (!siteRes.ok) {
        const err = await siteRes.json();
        throw new Error(err.error ?? "생성 실패");
      }
      const data = (await siteRes.json()) as { slug: string };
      setResult({ slug: data.slug });
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류");
    }
  }

  if (result) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>생성 완료</h1>
        <p style={{ fontSize: 13, color: "#666", margin: "8px 0 20px" }}>
          서브도메인 배포 전에도 아래 경로로 바로 확인할 수 있어요.
        </p>
        <a
          href={`/site/${result.slug}`}
          style={{ color: "#2563eb", fontWeight: 700 }}
        >
          /site/{result.slug} 열기 →
        </a>
        <p style={{ fontSize: 12, color: "#999", marginTop: 16 }}>
          실서비스 URL: {result.slug}.cornerpage.co (로컬 확인: {result.slug}
          .localhost:3000)
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20 }}>
        미니홈페이지 만들기 (임시 폼)
      </h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Field label="업체명">
          <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
        </Field>
        <Field label="업종">
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </Field>
        <Field label="톤">
          <select value={tone} onChange={(e) => setTone(e.target.value as AxisATone)}>
            <option value="감성형">감성형</option>
            <option value="신뢰형">신뢰형</option>
            <option value="혼합형">혼합형</option>
          </select>
        </Field>
        <Field label="레이아웃">
          <select value={layout} onChange={(e) => setLayout(e.target.value as AxisBLayout)}>
            <option value="메뉴우선">메뉴우선</option>
            <option value="갤러리우선">갤러리우선</option>
            <option value="해당없음">해당없음</option>
          </select>
        </Field>
        <Field label="주 CTA">
          <select value={ctaAction} onChange={(e) => setCtaAction(e.target.value as CtaPrimaryAction)}>
            <option value="call">전화</option>
            <option value="reservation">예약</option>
            <option value="direction">오시는 길</option>
          </select>
        </Field>
        <Field label="로고 이미지">
          <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
        </Field>
        <Field label="대표 사진">
          <input type="file" accept="image/*" onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)} />
        </Field>
        <Field label="배지 문구">
          <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="망원동 · 카페" />
        </Field>
        <Field label="헤드라인">
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} />
        </Field>
        <Field label="태그라인">
          <textarea value={tagline} onChange={(e) => setTagline(e.target.value)} rows={2} />
        </Field>
        <Field label="전화번호">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <Field label="주소">
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
        </Field>

        <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <legend style={{ fontSize: 13, fontWeight: 700 }}>신뢰 지표 3개</legend>
          {trustStrip.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                placeholder="값 (예: 4.8)"
                value={item.value}
                onChange={(e) =>
                  setTrustStrip((prev) =>
                    prev.map((v, idx) => (idx === i ? { ...v, value: e.target.value } : v))
                  )
                }
              />
              <input
                placeholder="라벨 (예: 네이버 별점)"
                value={item.label}
                onChange={(e) =>
                  setTrustStrip((prev) =>
                    prev.map((v, idx) => (idx === i ? { ...v, label: e.target.value } : v))
                  )
                }
              />
            </div>
          ))}
        </fieldset>

        <Field label="메뉴 섹션 제목">
          <input value={menuLabel} onChange={(e) => setMenuLabel(e.target.value)} />
        </Field>

        <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
          <legend style={{ fontSize: 13, fontWeight: 700 }}>메뉴 항목</legend>
          {menuItems.map((item, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
              <input
                placeholder="이름"
                value={item.name}
                onChange={(e) =>
                  setMenuItems((prev) =>
                    prev.map((v, idx) => (idx === i ? { ...v, name: e.target.value } : v))
                  )
                }
              />
              <input
                placeholder="가격 (예: 6,500원)"
                value={item.price}
                onChange={(e) =>
                  setMenuItems((prev) =>
                    prev.map((v, idx) => (idx === i ? { ...v, price: e.target.value } : v))
                  )
                }
              />
              <input
                placeholder="설명"
                value={item.description}
                onChange={(e) =>
                  setMenuItems((prev) =>
                    prev.map((v, idx) => (idx === i ? { ...v, description: e.target.value } : v))
                  )
                }
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setMenuItems((prev) =>
                    prev.map((v, idx) =>
                      idx === i ? { ...v, file: e.target.files?.[0] ?? null } : v
                    )
                  )
                }
              />
            </div>
          ))}
          <button type="button" onClick={addMenuItem} style={{ fontSize: 13 }}>
            + 메뉴 추가
          </button>
        </fieldset>

        {status === "error" && <p style={{ color: "crimson", fontSize: 13 }}>{errorMsg}</p>}

        <button
          type="submit"
          disabled={status === "submitting"}
          style={{
            padding: "12px 16px",
            background: "#111",
            color: "white",
            borderRadius: 8,
            fontWeight: 700,
          }}
        >
          {status === "submitting" ? "생성 중..." : "홈페이지 만들기"}
        </button>
      </form>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}
