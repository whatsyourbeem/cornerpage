"use client";

import { useState } from "react";
import type { CtaInteractionMode, CtaPrimaryAction, DayOfWeek, ExternalLinkPlatform } from "@/lib/content-types";
import {
  DAYS,
  Field,
  HoursEditor,
  ProgressBar,
  Section,
  WizardNav,
  defaultHours,
  fileInputStyle,
  fileNameStyle,
  type DayHours,
  type FaqPairDraft,
} from "../_shared/form-ui";
import { ManualGenerationFlow, type PendingUpload } from "../_shared/manual-flow";

/**
 * general vertical 입력 폼. spec/for-frontend/general/input-questions.md의 STEP
 * 구성을 그대로 따른다. 업종은 자유 텍스트로만 받고(축A/B 판단은 이 값이 아니라
 * 스킬이 전체 답변을 보고 내림 — SKILL.md), 이후 문항 라벨은 업종별로 프론트가
 * 미리 분기하지 않고 전부 중립적으로 유지한다("메뉴" 대신 "대표 서비스·상품" 등).
 *
 * 톤·레이아웃·카피는 여기서 확정하지 않는다 — 스킬(Claude)이 원본 사업 정보를
 * 보고 직접 판단할 몫이다(generate-content.ts 참고).
 *
 * ⚠️ 클로드 API는 아직 자동 호출하지 않는다 — 마지막 단계에서 실제 이미지
 * 업로드·draft 발급까지 마친 뒤 "보낼 요청 본문"을 화면에 보여주고, 사람이
 * claude.ai 등에 직접 붙여넣어 받은 응답을 다시 붙여넣으면 나머지(보정·검증·
 * 저장)를 수행한다 — ManualGenerationFlow(../_shared/manual-flow.tsx) 참고.
 */

const STEPS = ["업종", "기본 정보", "강점·소개", "서비스·사진", "신뢰·링크", "이용방법·FAQ"];

interface MenuItemDraft {
  name: string;
  price: string;
  consult: boolean;
  description: string;
  image: File | null;
}

interface ReviewDraft {
  body: string;
  author: string;
  rating: string;
}

export default function GeneralCreatePage() {
  const [step, setStep] = useState(0);

  const [industry, setIndustry] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [is24h, setIs24h] = useState(false);
  const [hours, setHours] = useState<Record<DayOfWeek, DayHours>>(defaultHours());
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [ctaPrimaryAction, setCtaPrimaryAction] = useState<CtaPrimaryAction>("call");

  const [intro, setIntro] = useState("");
  const [philosophyText, setPhilosophyText] = useState("");
  const [atmosphereText, setAtmosphereText] = useState("");
  const [strengthsText, setStrengthsText] = useState("");

  const [menuItems, setMenuItems] = useState<MenuItemDraft[]>([
    { name: "", price: "", consult: false, description: "", image: null },
  ]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

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

  const [howItWorksNote, setHowItWorksNote] = useState("");
  const [faqPairs, setFaqPairs] = useState<FaqPairDraft[]>([{ question: "", answer: "" }]);

  const [showManualFlow, setShowManualFlow] = useState(false);

  function canProceed(): boolean {
    if (step === 0) return industry.trim() !== "";
    if (step === 1) return businessName.trim() !== "" && address.trim() !== "" && phone.trim() !== "";
    if (step === 3) return menuItems.some((item) => item.name.trim() !== "");
    return true;
  }

  function updateMenuItem(i: number, patch: Partial<MenuItemDraft>) {
    setMenuItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  function updateFaqPair(i: number, patch: Partial<FaqPairDraft>) {
    setFaqPairs((prev) => prev.map((pair, idx) => (idx === i ? { ...pair, ...patch } : pair)));
  }

  const namedMenuItems = menuItems.filter((item) => item.name.trim());

  const pendingUploads: PendingUpload[] = [
    ...(heroFile ? [{ slot: "hero", file: heroFile }] : []),
    ...(logoFile ? [{ slot: "logo", file: logoFile }] : []),
    ...namedMenuItems.flatMap((item, i) => (item.image ? [{ slot: `menu-${i}`, file: item.image }] : [])),
    ...galleryFiles.map((file, i) => ({ slot: `gallery-${i}`, file })),
  ];

  function buildAnswers(urls: Record<string, string>) {
    const finalStrengths = strengthsText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const faqAnswers = faqPairs
      .filter((pair) => pair.question.trim() && pair.answer.trim())
      .map((pair) => ({ question: pair.question.trim(), answer: pair.answer.trim() }));

    return {
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
      hero_image_url: urls["hero"] ?? null,
      logo_url: urls["logo"] ?? null,
      cta_primary_action: ctaPrimaryAction,
      intro: intro.trim() || null,
      philosophy: philosophyText.trim() || null,
      atmosphere: atmosphereText.trim() || null,
      strengths: finalStrengths,
      menu_items: namedMenuItems.map((item, i) => ({
        name: item.name.trim(),
        price: item.consult ? null : item.price.trim() || null,
        description: item.description.trim() || null,
        image_url: urls[`menu-${i}`] ?? null,
      })),
      gallery_image_urls: galleryFiles.map((_, i) => urls[`gallery-${i}`]).filter((u): u is string => !!u),
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
  }

  if (showManualFlow) {
    return (
      <ManualGenerationFlow
        vertical="general"
        pendingUploads={pendingUploads}
        buildAnswers={buildAnswers}
        onBack={() => setShowManualFlow(false)}
      />
    );
  }

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px 80px" }}>
      <ProgressBar step={step + 1} total={STEPS.length} label={STEPS[step]} />

      {step === 0 && (
        <Section title="어떤 업종이세요?">
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="예: 카페, 미용실, 헬스장, 학원, 병의원, 스터디카페, 장례용품..."
            style={{ fontSize: 16, padding: "14px 12px" }}
            autoFocus
          />
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
            {!is24h && <HoursEditor hours={hours} onChange={setHours} />}
          </fieldset>

          <Field label="대표 사진">
            <input
              type="file"
              accept="image/*"
              style={fileInputStyle}
              onChange={(e) => setHeroFile(e.target.files?.[0] ?? null)}
            />
            {heroFile && <p style={fileNameStyle}>선택됨: {heroFile.name}</p>}
          </Field>
          <Field label="로고">
            <input
              type="file"
              accept="image/*"
              style={fileInputStyle}
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
            {logoFile && <p style={fileNameStyle}>선택됨: {logoFile.name}</p>}
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
          <p style={{ fontSize: 13, color: "#666", margin: "-8px 0 0" }}>
            답해주신 만큼 홈페이지가 풍부해져요. 정성껏 만들어 드릴게요.
          </p>
          <Field label="한 줄 소개나 가게 소개 문구">
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              placeholder="이미 쓰시는 문구가 있으면 넣어주세요. 없으면 저희가 만들어 드리니 비워두셔도 괜찮아요."
            />
          </Field>
          <Field label="해당되는 강점이 있다면 적어주세요">
            <textarea
              value={strengthsText}
              onChange={(e) => setStrengthsText(e.target.value)}
              rows={3}
              placeholder="쉼표나 줄바꿈으로 구분해서 적어주세요. 예: 오래된 운영 연차, 주차 가능, 반려동물 동반"
            />
          </Field>
          <Field
            label="이 일을 시작하게 된 계기나 철학이 있나요?"
            hint="짧아도 좋아요. 이 답변은 소개 문단에 섞이지 않고 눈에 띄는 문구로 따로 강조돼요."
          >
            <textarea
              value={philosophyText}
              onChange={(e) => setPhilosophyText(e.target.value)}
              rows={2}
              placeholder="예: 손님이 아니라 단골이 되어주셨으면 합니다"
            />
          </Field>
          <Field
            label="공간·분위기에서 손님들이 특히 좋아하는 부분이 있나요?"
            hint="이 답변이 있으면 '정성으로 준비했습니다' 같은 뻔한 문장 대신, 진짜 이 가게만의 분위기가 전달돼요."
          >
            <textarea
              value={atmosphereText}
              onChange={(e) => setAtmosphereText(e.target.value)}
              rows={2}
              placeholder="예: 낡은 나무 창틀과 오래된 라디오 소리가 늘 배어있어요"
            />
          </Field>
        </Section>
      )}

      {step === 3 && (
        <Section title="대표 서비스·상품·사진">
          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>대표 서비스·상품</legend>
            {menuItems.map((item, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <input
                  placeholder="이름 (예: 아메리카노, 커트, 개인레슨 1회)"
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
                <input
                  placeholder="이 메뉴가 특별한 이유가 있다면 적어주세요 (선택, 예: 국내산 원두만 사용)"
                  value={item.description}
                  onChange={(e) => updateMenuItem(i, { description: e.target.value })}
                />
                <input
                  type="file"
                  accept="image/*"
                  style={fileInputStyle}
                  onChange={(e) => updateMenuItem(i, { image: e.target.files?.[0] ?? null })}
                />
                {item.image && <p style={fileNameStyle}>선택됨: {item.image.name}</p>}
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setMenuItems((prev) => [
                  ...prev,
                  { name: "", price: "", consult: false, description: "", image: null },
                ])
              }
              style={{ fontSize: 13 }}
            >
              + 항목 추가
            </button>
          </fieldset>

          <Field label="갤러리 사진 (몇 장이든 업로드한 만큼)">
            <input
              type="file"
              accept="image/*"
              multiple
              style={fileInputStyle}
              onChange={(e) => setGalleryFiles(Array.from(e.target.files ?? []))}
            />
            {galleryFiles.length > 0 && <p style={fileNameStyle}>{galleryFiles.length}장 선택됨</p>}
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
          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>자주 묻는 질문이 있다면 적어주세요</legend>
            {faqPairs.map((pair, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <input
                  placeholder="질문 (예: 주차 되나요?)"
                  value={pair.question}
                  onChange={(e) => updateFaqPair(i, { question: e.target.value })}
                />
                <input
                  placeholder="답변"
                  value={pair.answer}
                  onChange={(e) => updateFaqPair(i, { answer: e.target.value })}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFaqPairs((prev) => [...prev, { question: "", answer: "" }])}
              style={{ fontSize: 13 }}
            >
              + 질문 추가
            </button>
          </fieldset>
        </Section>
      )}

      <WizardNav
        step={step}
        isLastStep={step === STEPS.length - 1}
        canProceed={canProceed()}
        onBack={() => setStep((s) => s - 1)}
        onNext={() => setStep((s) => s + 1)}
        onSubmit={() => setShowManualFlow(true)}
      />
    </main>
  );
}
