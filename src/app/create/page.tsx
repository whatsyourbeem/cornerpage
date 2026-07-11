"use client";

import { useState } from "react";
import type {
  CtaInteractionMode,
  CtaPrimaryAction,
  DayOfWeek,
  ExternalLinkPlatform,
} from "@/lib/content-types";

/**
 * 실제 서비스의 질문형 입력 폼. skill/references/input-questions.md의 STEP
 * 구성을 그대로 따른다 — 업종을 먼저 물어서 이후 문항(강점·FAQ 후보)의 라벨을
 * 바꾸고, 필수 정보를 먼저·선택 정보를 나중에 묻는다. 톤(axis_a_tone)·
 * 레이아웃(axis_b_layout)·카피는 여기서 확정하지 않는다 — 그건 스킬(Claude)이
 * 이 원본 사업 정보를 보고 직접 판단할 몫이다(generate-content.ts 참고).
 *
 * 이미지는 첫 화면부터 File로 들고 있다가, 최종 제출 시점에만 draft id를
 * 발급받고 /api/upload로 업로드해서 URL로 바꾼 뒤 answers에 담아 보낸다
 * (스킬은 파일이 아니라 이미 발급된 URL만 받는다는 원칙 — input-questions.md).
 */

const INDUSTRY_OPTIONS = [
  "카페/식당",
  "미용실/네일",
  "헬스장",
  "병의원",
  "학원",
  "공방",
  "스터디카페",
  "장례/긴급",
  "기타",
] as const;

const INDUSTRY_STRENGTHS: Record<string, string[]> = {
  "카페/식당": [
    "직접 로스팅/제조",
    "오래된 운영 연차",
    "시그니처 메뉴",
    "좌석·공간 분위기",
    "예약 가능",
    "반려동물 동반",
    "주차",
  ],
  "미용실/네일": ["동시 시술 인원", "역세권 접근성", "이달의 아트", "원장 경력", "프라이빗룸", "예약제 운영"],
  헬스장: ["규모(평수)", "트레이너 경력", "1:1 전문", "편의시설(샤워실·주차)", "24시간", "접근성"],
  병의원: ["전문의 자격", "임상경력 연차", "대학병원 이력", "협진 체계", "최신 장비", "야간진료", "주차"],
  학원: ["강사 경력", "소수정예", "커리큘럼 체계", "합격·성과 실적", "접근성"],
  공방: ["작가·강사 경력", "소수정예 클래스", "체험 가능", "재료 직접 준비", "프라이빗 공간", "접근성"],
  스터디카페: ["24시간 무인", "좌석 구분(포커스/카페존)", "프라이빗룸", "사물함·대여", "접근성"],
  "장례/긴급": ["운영 연차", "24시간 대응", "직접 제작·공급", "빠른 준비", "종교별 구비"],
  기타: [],
};

const INDUSTRY_FAQS: Record<string, string[]> = {
  "카페/식당": ["주차 되나요?", "예약 되나요?", "반려동물 동반 가능한가요?", "단체 가능한가요?", "포장 되나요?", "콘센트·와이파이 있나요?"],
  "미용실/네일": ["예약 필수인가요?", "시술 시간 얼마나 걸리나요?", "제거만도 가능한가요?", "주차 되나요?", "아이 동반 가능한가요?"],
  헬스장: ["회원권 종류가 어떻게 되나요?", "환불 규정은요?", "주차 되나요?", "샤워실 있나요?", "PT 상담은 어떻게 하나요?"],
  병의원: ["주차 되나요?", "실손보험 적용되나요?", "당일 진료 가능한가요?", "어린이 진료도 하나요?", "야간진료 하나요?"],
  학원: ["체험 수업 있나요?", "수강료는 어떻게 되나요?", "재료비 별도인가요?", "초보도 가능한가요?"],
  공방: ["체험 수업 있나요?", "재료비 별도인가요?", "초보도 가능한가요?", "주차 되나요?"],
  스터디카페: ["회원가입 어떻게 하나요?", "24시간 언제나 들어갈 수 있나요?", "환불 가능한가요?", "대여 물품 있나요?", "위치가 어디인가요?"],
  "장례/긴급": ["비용은 어떻게 되나요?", "급하게 당일 준비 가능한가요?", "종교별 용품도 있나요?", "상담만 받아도 되나요?"],
  기타: [],
};

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

type DayHours = { open: string; close: string; closed: boolean };

interface MenuItemDraft {
  name: string;
  price: string;
  consult: boolean;
}

interface ReviewDraft {
  body: string;
  author: string;
  rating: string;
}

const STEPS = ["업종", "기본 정보", "강점·소개", "메뉴·사진", "신뢰·링크", "이용방법·FAQ"];

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
  const [step, setStep] = useState(0);

  // STEP 1
  const [industry, setIndustry] = useState("");

  // STEP 2
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [is24h, setIs24h] = useState(false);
  const [hours, setHours] = useState<Record<DayOfWeek, DayHours>>(
    Object.fromEntries(DAYS.map((d) => [d.key, { open: "09:00", close: "21:00", closed: false }])) as Record<
      DayOfWeek,
      DayHours
    >
  );
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [ctaPrimaryAction, setCtaPrimaryAction] = useState<CtaPrimaryAction>("call");

  // STEP 3
  const [intro, setIntro] = useState("");
  const [selectedStrengths, setSelectedStrengths] = useState<string[]>([]);
  const [customStrength, setCustomStrength] = useState("");

  // STEP 4
  const [menuItems, setMenuItems] = useState<MenuItemDraft[]>([{ name: "", price: "", consult: false }]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  // STEP 5
  const [links, setLinks] = useState<Record<ExternalLinkPlatform, string>>({
    instagram: "",
    kakao: "",
    naver_reservation: "",
    blog: "",
  });
  const [reviews, setReviews] = useState<ReviewDraft[]>([
    { body: "", author: "", rating: "" },
    { body: "", author: "", rating: "" },
  ]);
  const [ctaInteractionMode, setCtaInteractionMode] = useState<CtaInteractionMode>("functional");

  // 신규 블록 문항
  const [howItWorksNote, setHowItWorksNote] = useState("");
  const [faqChecked, setFaqChecked] = useState<Record<string, boolean>>({});
  const [faqAnswerText, setFaqAnswerText] = useState<Record<string, string>>({});

  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<{ slug: string } | null>(null);

  const strengthCandidates = INDUSTRY_STRENGTHS[industry] ?? [];
  const faqCandidates = INDUSTRY_FAQS[industry] ?? [];

  function canProceed(): boolean {
    if (step === 0) return industry !== "";
    if (step === 1) return businessName.trim() !== "" && address.trim() !== "" && phone.trim() !== "";
    if (step === 3) return menuItems.some((item) => item.name.trim() !== "");
    return true;
  }

  function toggleStrength(s: string) {
    setSelectedStrengths((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function updateMenuItem(i: number, patch: Partial<MenuItemDraft>) {
    setMenuItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  async function handleSubmit() {
    setStatus("submitting");
    setErrorMsg("");
    try {
      const draftRes = await fetch("/api/sites/draft", { method: "POST" });
      const { id } = (await draftRes.json()) as { id: string };

      const heroUrl = heroFile ? await uploadImage(id, "hero", heroFile) : null;
      const logoUrl = logoFile ? await uploadImage(id, "logo", logoFile) : null;
      const galleryUrls = await Promise.all(
        galleryFiles.map((file, i) => uploadImage(id, `gallery-${i}`, file))
      );

      const finalStrengths = [...selectedStrengths, ...(customStrength.trim() ? [customStrength.trim()] : [])];

      const faqAnswers = faqCandidates
        .filter((q) => faqChecked[q] && faqAnswerText[q]?.trim())
        .map((q) => ({ question: q, answer: faqAnswerText[q].trim() }));

      const answers = {
        industry_category: industry,
        business_name: businessName,
        address,
        phone,
        hours: is24h
          ? { type: "24h" as const }
          : {
              type: "structured" as const,
              structured: DAYS.map((d) => ({
                day: d.key,
                open: hours[d.key].closed ? null : hours[d.key].open,
                close: hours[d.key].closed ? null : hours[d.key].close,
                closed: hours[d.key].closed,
              })),
            },
        hero_image_url: heroUrl,
        logo_url: logoUrl,
        cta_primary_action: ctaPrimaryAction,
        intro: intro.trim() || null,
        strengths: finalStrengths,
        menu_items: menuItems
          .filter((item) => item.name.trim())
          .map((item) => ({ name: item.name.trim(), price: item.consult ? null : item.price.trim() || null })),
        gallery_image_urls: galleryUrls,
        external_links: (Object.keys(links) as ExternalLinkPlatform[])
          .filter((platform) => links[platform].trim())
          .map((platform) => ({ platform, url: links[platform].trim() })),
        reviews: reviews
          .filter((r) => r.body.trim())
          .map((r) => ({
            body: r.body.trim(),
            author: r.author.trim() || "익명",
            rating: r.rating ? Number(r.rating) : null,
          })),
        cta_interaction_mode: ctaInteractionMode,
        how_it_works_note: howItWorksNote.trim() || null,
        faq_answers: faqAnswers,
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
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "60px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>홈페이지가 만들어졌어요</h1>
        <p style={{ fontSize: 13, color: "#666", margin: "8px 0 24px" }}>
          서브도메인 배포 전에도 아래 경로로 바로 확인할 수 있어요.
        </p>
        <a href={`/site/${result.slug}`} style={{ color: "#2563eb", fontWeight: 700, fontSize: 16 }}>
          /site/{result.slug} 열기 →
        </a>
        <p style={{ fontSize: 12, color: "#999", marginTop: 20 }}>
          실서비스 URL: {result.slug}.cornerpage.co (로컬 확인: {result.slug}.localhost:3000)
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px 80px" }}>
      <p style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
        {step + 1} / {STEPS.length} · {STEPS[step]}
      </p>
      <div style={{ height: 4, background: "#eee", borderRadius: 2, marginBottom: 28 }}>
        <div
          style={{
            height: "100%",
            width: `${((step + 1) / STEPS.length) * 100}%`,
            background: "#111",
            borderRadius: 2,
            transition: "width 0.2s",
          }}
        />
      </div>

      {step === 0 && (
        <Section title="어떤 업종이세요?">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {INDUSTRY_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setIndustry(opt)}
                style={{
                  padding: "14px 10px",
                  borderRadius: 8,
                  border: industry === opt ? "2px solid #111" : "1px solid #ddd",
                  background: industry === opt ? "#111" : "white",
                  color: industry === opt ? "white" : "#111",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        </Section>
      )}

      {step === 1 && (
        <Section title="기본 정보">
          <Field label="가게 이름">
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="예: 밀물다방" />
          </Field>
          <Field label="지역/주소">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="예: 서울 마포구 망원동" />
          </Field>
          <Field label="전화번호">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="02-1234-5678" />
          </Field>

          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>영업시간</legend>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 8 }}>
              <input type="checkbox" checked={is24h} onChange={(e) => setIs24h(e.target.checked)} />
              24시간 운영
            </label>
            {!is24h && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {DAYS.map((d) => (
                  <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <span style={{ width: 20, fontWeight: 700 }}>{d.label}</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={hours[d.key].closed}
                        onChange={(e) =>
                          setHours((prev) => ({ ...prev, [d.key]: { ...prev[d.key], closed: e.target.checked } }))
                        }
                      />
                      휴무
                    </label>
                    {!hours[d.key].closed && (
                      <>
                        <input
                          type="time"
                          value={hours[d.key].open}
                          onChange={(e) =>
                            setHours((prev) => ({ ...prev, [d.key]: { ...prev[d.key], open: e.target.value } }))
                          }
                        />
                        <span>–</span>
                        <input
                          type="time"
                          value={hours[d.key].close}
                          onChange={(e) =>
                            setHours((prev) => ({ ...prev, [d.key]: { ...prev[d.key], close: e.target.value } }))
                          }
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          <Field label="대표 사진">
            <input type="file" accept="image/*" onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)} />
          </Field>
          <Field label="로고">
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
          </Field>

          <Field label="손님이 가장 먼저 하길 바라는 행동">
            <select value={ctaPrimaryAction} onChange={(e) => setCtaPrimaryAction(e.target.value as CtaPrimaryAction)}>
              <option value="call">전화</option>
              <option value="reservation">예약</option>
              <option value="direction">방문·길찾기</option>
            </select>
          </Field>
        </Section>
      )}

      {step === 2 && (
        <Section title="강점·소개 (선택)">
          <Field label="한 줄 소개나 가게 소개 문구">
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              placeholder="이미 쓰시는 문구가 있으면 넣어주세요. 없으면 저희가 만들어 드리니 비워두셔도 괜찮아요."
            />
          </Field>
          {strengthCandidates.length > 0 && (
            <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <legend style={{ fontSize: 13, fontWeight: 700 }}>해당되는 강점을 골라주세요</legend>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {strengthCandidates.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStrength(s)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: selectedStrengths.includes(s) ? "1px solid #111" : "1px solid #ddd",
                      background: selectedStrengths.includes(s) ? "#111" : "white",
                      color: selectedStrengths.includes(s) ? "white" : "#111",
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <Field label="그 외 강점이 있다면 직접 입력">
            <input value={customStrength} onChange={(e) => setCustomStrength(e.target.value)} placeholder="예: 24년째 한자리에서 운영" />
          </Field>
        </Section>
      )}

      {step === 3 && (
        <Section title="메뉴/서비스·사진">
          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>대표 메뉴/서비스</legend>
            {menuItems.map((item, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <input
                  placeholder="이름 (예: 아메리카노)"
                  value={item.name}
                  onChange={(e) => updateMenuItem(i, { name: e.target.value })}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    placeholder="가격 (예: 4,500원)"
                    value={item.price}
                    disabled={item.consult}
                    onChange={(e) => updateMenuItem(i, { price: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, whiteSpace: "nowrap" }}>
                    <input
                      type="checkbox"
                      checked={item.consult}
                      onChange={(e) => updateMenuItem(i, { consult: e.target.checked })}
                    />
                    상담 문의
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setMenuItems((prev) => [...prev, { name: "", price: "", consult: false }])}
              style={{ fontSize: 13 }}
            >
              + 메뉴 추가
            </button>
          </fieldset>

          <Field label="갤러리 사진 (몇 장이든 업로드한 만큼)">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))}
            />
            {galleryFiles.length > 0 && (
              <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{galleryFiles.length}장 선택됨</p>
            )}
          </Field>
        </Section>
      )}

      {step === 4 && (
        <Section title="신뢰·링크 (선택)">
          <Field label="인스타그램">
            <input value={links.instagram} onChange={(e) => setLinks((p) => ({ ...p, instagram: e.target.value }))} placeholder="https://instagram.com/..." />
          </Field>
          <Field label="카카오">
            <input value={links.kakao} onChange={(e) => setLinks((p) => ({ ...p, kakao: e.target.value }))} placeholder="https://pf.kakao.com/..." />
          </Field>
          <Field label="네이버 예약">
            <input
              value={links.naver_reservation}
              onChange={(e) => setLinks((p) => ({ ...p, naver_reservation: e.target.value }))}
              placeholder="https://booking.naver.com/..."
            />
          </Field>
          <Field label="블로그">
            <input value={links.blog} onChange={(e) => setLinks((p) => ({ ...p, blog: e.target.value }))} placeholder="https://blog.naver.com/..." />
          </Field>

          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>리뷰가 있으면 1~2개 붙여주세요 (원문 그대로)</legend>
            {reviews.map((r, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <textarea
                  placeholder="리뷰 내용"
                  rows={2}
                  value={r.body}
                  onChange={(e) => setReviews((prev) => prev.map((v, idx) => (idx === i ? { ...v, body: e.target.value } : v)))}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="작성자 (예: 김O영)"
                    value={r.author}
                    onChange={(e) => setReviews((prev) => prev.map((v, idx) => (idx === i ? { ...v, author: e.target.value } : v)))}
                  />
                  <input
                    placeholder="별점 (선택, 1~5)"
                    value={r.rating}
                    onChange={(e) => setReviews((prev) => prev.map((v, idx) => (idx === i ? { ...v, rating: e.target.value } : v)))}
                    style={{ width: 100 }}
                  />
                </div>
              </div>
            ))}
          </fieldset>

          <Field label="예약·문의 방식">
            <select value={ctaInteractionMode} onChange={(e) => setCtaInteractionMode(e.target.value as CtaInteractionMode)}>
              <option value="functional">버튼으로 바로 연결(전화 걸기, 예약 링크 등)</option>
              <option value="guided">DM·카톡 등 사람이 직접 응대</option>
            </select>
          </Field>
        </Section>
      )}

      {step === 5 && (
        <Section title="이용방법·FAQ (선택)">
          <Field label="특이한 이용 절차가 있다면 알려주세요">
            <textarea
              value={howItWorksNote}
              onChange={(e) => setHowItWorksNote(e.target.value)}
              rows={2}
              placeholder="업종별 기본 흐름은 자동으로 만들어져요. 특이한 절차만 적어주세요."
            />
          </Field>
          {faqCandidates.length > 0 && (
            <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <legend style={{ fontSize: 13, fontWeight: 700 }}>자주 묻는 질문 — 답할 것만 체크해서 입력해주세요</legend>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {faqCandidates.map((q) => (
                  <div key={q}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={!!faqChecked[q]}
                        onChange={(e) => setFaqChecked((prev) => ({ ...prev, [q]: e.target.checked }))}
                      />
                      {q}
                    </label>
                    {faqChecked[q] && (
                      <input
                        placeholder="답변"
                        value={faqAnswerText[q] ?? ""}
                        onChange={(e) => setFaqAnswerText((prev) => ({ ...prev, [q]: e.target.value }))}
                        style={{ marginTop: 4, width: "100%" }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </fieldset>
          )}
        </Section>
      )}

      {status === "error" && <p style={{ color: "crimson", fontSize: 13, marginTop: 12 }}>{errorMsg}</p>}

      <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} style={navButtonStyle}>
            이전
          </button>
        )}
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            disabled={!canProceed()}
            onClick={() => setStep((s) => s + 1)}
            style={{ ...navButtonStyle, ...primaryButtonStyle, opacity: canProceed() ? 1 : 0.4 }}
          >
            다음
          </button>
        ) : (
          <button
            type="button"
            disabled={status === "submitting"}
            onClick={handleSubmit}
            style={{ ...navButtonStyle, ...primaryButtonStyle }}
          >
            {status === "submitting" ? "만드는 중... (최대 1분)" : "홈페이지 만들기"}
          </button>
        )}
      </div>
    </main>
  );
}

const navButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: "14px 16px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "white",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const primaryButtonStyle: React.CSSProperties = {
  background: "#111",
  color: "white",
  border: "1px solid #111",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{title}</h1>
      {children}
    </div>
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
