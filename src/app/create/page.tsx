"use client";

import { useState } from "react";
import type {
  CtaInteractionMode,
  CtaPrimaryAction,
  DayOfWeek,
  ExternalLinkPlatform,
} from "@/lib/content-types";
import { VERTICALS, type Vertical } from "@/lib/verticals";

/**
 * 실제 서비스의 질문형 입력 폼. STEP 0에서 vertical(업종 대분류)을 드롭다운으로
 * 먼저 고르게 한 뒤, STEP 1부터는 spec/for-frontend/{vertical}/input-questions.md의
 * STEP 구성을 그대로 따른다 — general과 boutique-fitness는 스키마 자체가 달라서
 * (신규 블록 3종·meta 구조 변경 등, generate-content.ts 참고) 질문 흐름도 완전히
 * 분리된다. general 안에서의 "업종"(예: 카페·미용실)은 이 vertical 선택과 다른
 * 질문이다 — 자유 텍스트로 받고(축A/B 판단은 이 값이 아니라 스킬이 전체 답변을
 * 보고 내림 — SKILL.md), 이후 문항 라벨은 업종별로 프론트가 미리 분기하지 않고
 * 전부 중립적으로 유지한다("메뉴" 대신 "대표 서비스·상품" 등).
 *
 * 톤·레이아웃·카피는 여기서 확정하지 않는다 — 그건 스킬(Claude)이 원본 사업
 * 정보를 보고 직접 판단할 몫이다(generate-content.ts 참고).
 *
 * ⚠️ 지금은 실제 Claude API를 호출하지 않는다 — 두 vertical 다 새 질문 흐름이라
 * 먼저 수집되는 데이터 모양부터 확인하는 단계다(RENDERER_READY_VERTICALS로
 * boutique-fitness 생성 자체가 아직 막혀있기도 함 — verticals.ts 참고). 마지막
 * 단계에서 답변을 실제로 보낼 JSON 그대로 화면에 표시만 한다. 이미지도 실제로
 * 업로드하지 않고 파일명만 placeholder로 넣는다 — 실제 생성이 열리면 /api/upload
 * 호출과 /api/sites 제출을 다시 연결해야 한다.
 */

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

function defaultHours(): Record<DayOfWeek, DayHours> {
  return Object.fromEntries(
    DAYS.map((d) => [d.key, { open: "09:00", close: "21:00", closed: false }])
  ) as Record<DayOfWeek, DayHours>;
}

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

interface FaqPairDraft {
  question: string;
  answer: string;
}

interface ProfessionalDraft {
  name: string;
  title: string;
  photo: File | null;
  certificationsText: string;
  specialty: string;
  yearsExperience: string;
  bioQuote: string;
}

interface TransformationDraft {
  beforeImage: File | null;
  afterImage: File | null;
  durationLabel: string;
  resultHighlight: string;
  memberLabel: string;
  trainerTag: string;
}

interface BfReviewDraft {
  body: string;
  author: string;
  rating: string;
  source: string;
  trainerTag: string;
}

interface ProgramDraft {
  name: string;
  price: string;
  consult: boolean;
}

const GENERAL_STEPS = ["업종 선택", "업종", "기본 정보", "강점·소개", "서비스·사진", "신뢰·링크", "이용방법·FAQ"];
const BOUTIQUE_FITNESS_STEPS = ["업종 선택", "기본 정보", "전문가 프로필", "회원 변화·후기", "공간", "프로그램·이용방법"];

const VERTICAL_LABELS: Record<Vertical, { label: string; desc: string }> = {
  general: { label: "일반 업종", desc: "카페·미용실·네일샵·헬스장·학원·병의원 등" },
  "boutique-fitness": {
    label: "PT·필라테스·요가 스튜디오",
    desc: "1:1 또는 소수정예로 지도하는 트레이너 주도형 공간(대형 회원제 헬스장 제외)",
  },
};

/** 지금 단계는 실제 업로드를 하지 않으므로, 파일명을 그대로 placeholder로 보여준다. */
function fileLabel(file: File | null): string | null {
  return file ? `[선택된 파일] ${file.name}` : null;
}

export default function CreatePage() {
  const [vertical, setVertical] = useState<Vertical | null>(null);
  const [step, setStep] = useState(0);

  // ---------- general ----------
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

  // ---------- boutique-fitness ----------
  const [bfIndustryCategory, setBfIndustryCategory] = useState("");
  const [bfBusinessName, setBfBusinessName] = useState("");
  const [bfAddress, setBfAddress] = useState("");
  const [bfPhone, setBfPhone] = useState("");
  const [bfHours, setBfHours] = useState<Record<DayOfWeek, DayHours>>(defaultHours());
  const [bfContactMethod, setBfContactMethod] = useState<"kakao" | "instagram" | "phone">("kakao");
  const [bfContactLink, setBfContactLink] = useState("");
  const [bfHeroFile, setBfHeroFile] = useState<File | null>(null);
  const [bfLogoFile, setBfLogoFile] = useState<File | null>(null);
  const [bfCtaPrimaryAction, setBfCtaPrimaryAction] = useState<CtaPrimaryAction>("call");
  const [bfCtaInteractionMode, setBfCtaInteractionMode] = useState<CtaInteractionMode>("guided");
  const [bfLeadEmphasis, setBfLeadEmphasis] = useState<
    "" | "transformations" | "reviews" | "professionals" | "facility"
  >("");

  const [professionals, setProfessionals] = useState<ProfessionalDraft[]>([
    { name: "", title: "", photo: null, certificationsText: "", specialty: "", yearsExperience: "", bioQuote: "" },
  ]);

  const [transformations, setTransformations] = useState<TransformationDraft[]>([
    { beforeImage: null, afterImage: null, durationLabel: "", resultHighlight: "", memberLabel: "", trainerTag: "" },
  ]);
  const [bfReviews, setBfReviews] = useState<BfReviewDraft[]>([
    { body: "", author: "", rating: "", source: "", trainerTag: "" },
  ]);

  const [sizePyeong, setSizePyeong] = useState("");
  const [hasShower, setHasShower] = useState(false);
  const [hasLocker, setHasLocker] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [equipmentText, setEquipmentText] = useState("");
  const [facilityPhotos, setFacilityPhotos] = useState<File[]>([]);
  const [bfAtmosphereText, setBfAtmosphereText] = useState("");
  const [bfPhilosophyText, setBfPhilosophyText] = useState("");

  const [programs, setPrograms] = useState<ProgramDraft[]>([{ name: "", price: "", consult: true }]);
  const [freeTrialAvailable, setFreeTrialAvailable] = useState(false);
  const [bfHowItWorksNote, setBfHowItWorksNote] = useState("");
  const [bfFaqPairs, setBfFaqPairs] = useState<FaqPairDraft[]>([{ question: "", answer: "" }]);

  const [previewJson, setPreviewJson] = useState<string | null>(null);

  const isBoutiqueFitness = vertical === "boutique-fitness";
  const STEPS = isBoutiqueFitness ? BOUTIQUE_FITNESS_STEPS : GENERAL_STEPS;

  function canProceed(): boolean {
    if (step === 0) return vertical !== null;
    if (isBoutiqueFitness) {
      if (step === 1) return bfBusinessName.trim() !== "" && bfAddress.trim() !== "" && bfPhone.trim() !== "";
      if (step === 2) return professionals.some((p) => p.name.trim() !== "");
      return true;
    }
    if (step === 1) return industry.trim() !== "";
    if (step === 2) return businessName.trim() !== "" && address.trim() !== "" && phone.trim() !== "";
    if (step === 4) return menuItems.some((item) => item.name.trim() !== "");
    return true;
  }

  function updateMenuItem(i: number, patch: Partial<MenuItemDraft>) {
    setMenuItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  function updateFaqPair(i: number, patch: Partial<FaqPairDraft>) {
    setFaqPairs((prev) => prev.map((pair, idx) => (idx === i ? { ...pair, ...patch } : pair)));
  }

  function updateBfFaqPair(i: number, patch: Partial<FaqPairDraft>) {
    setBfFaqPairs((prev) => prev.map((pair, idx) => (idx === i ? { ...pair, ...patch } : pair)));
  }

  function updateProfessional(i: number, patch: Partial<ProfessionalDraft>) {
    setProfessionals((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function updateTransformation(i: number, patch: Partial<TransformationDraft>) {
    setTransformations((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function updateBfReview(i: number, patch: Partial<BfReviewDraft>) {
    setBfReviews((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function updateProgram(i: number, patch: Partial<ProgramDraft>) {
    setPrograms((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function buildGeneralAnswers() {
    const finalStrengths = strengthsText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const faqAnswers = faqPairs
      .filter((pair) => pair.question.trim() && pair.answer.trim())
      .map((pair) => ({ question: pair.question.trim(), answer: pair.answer.trim() }));
    const namedMenuItems = menuItems.filter((item) => item.name.trim());

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
      hero_image_url: fileLabel(heroFile),
      logo_url: fileLabel(logoFile),
      cta_primary_action: ctaPrimaryAction,
      intro: intro.trim() || null,
      philosophy: philosophyText.trim() || null,
      atmosphere: atmosphereText.trim() || null,
      strengths: finalStrengths,
      menu_items: namedMenuItems.map((item) => ({
        name: item.name.trim(),
        price: item.consult ? null : item.price.trim() || null,
        description: item.description.trim() || null,
        image_url: fileLabel(item.image),
      })),
      gallery_image_urls: galleryFiles.map((f) => fileLabel(f) as string),
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

  function buildBoutiqueFitnessAnswers() {
    const finalProfessionals = professionals
      .filter((p) => p.name.trim())
      .map((p) => ({
        name: p.name.trim(),
        title: p.title.trim(),
        photo_url: fileLabel(p.photo),
        certifications: p.certificationsText
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean),
        specialty: p.specialty.trim(),
        years_experience: p.yearsExperience.trim() ? Number(p.yearsExperience) : null,
        bio_quote: p.bioQuote.trim() || null,
      }));

    const finalTransformations = transformations
      .filter((t) => t.beforeImage || t.afterImage || t.resultHighlight.trim())
      .map((t) => ({
        before_image_url: fileLabel(t.beforeImage),
        after_image_url: fileLabel(t.afterImage),
        duration_label: t.durationLabel.trim(),
        result_highlight: t.resultHighlight.trim(),
        member_label: t.memberLabel.trim(),
        trainer_tag: t.trainerTag.trim() || null,
      }));

    const finalBfReviews = bfReviews
      .filter((r) => r.body.trim())
      .map((r) => ({
        body: r.body.trim(),
        author: r.author.trim() || "익명",
        rating: r.rating ? Number(r.rating) : null,
        source: r.source.trim() || null,
        trainer_tag: r.trainerTag.trim() || null,
      }));

    const equipmentList = equipmentText
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const hasFacilityData =
      sizePyeong.trim() || hasShower || hasLocker || hasParking || equipmentList.length > 0 || facilityPhotos.length > 0;

    const faqAnswers = bfFaqPairs
      .filter((pair) => pair.question.trim() && pair.answer.trim())
      .map((pair) => ({ question: pair.question.trim(), answer: pair.answer.trim() }));

    const finalPrograms = programs
      .filter((p) => p.name.trim())
      .map((p) => ({ name: p.name.trim(), price: p.consult ? null : p.price.trim() || null }));

    return {
      industry_category: bfIndustryCategory,
      business_name: bfBusinessName,
      address: bfAddress,
      phone: bfPhone,
      consult_hours: {
        type: "structured" as const,
        structured: DAYS.map((d) => ({
          day: d.key,
          open: bfHours[d.key].closed ? null : bfHours[d.key].open,
          close: bfHours[d.key].closed ? null : bfHours[d.key].close,
          closed: bfHours[d.key].closed,
        })),
      },
      contact_method: bfContactMethod,
      contact_link: bfContactLink.trim() || null,
      hero_image_url: fileLabel(bfHeroFile),
      logo_url: fileLabel(bfLogoFile),
      cta_primary_action: bfCtaPrimaryAction,
      cta_interaction_mode: bfCtaInteractionMode,
      lead_emphasis: bfLeadEmphasis || null,
      professionals: finalProfessionals,
      transformations: finalTransformations,
      reviews: finalBfReviews,
      facility: hasFacilityData
        ? {
            size_pyeong: sizePyeong.trim() ? Number(sizePyeong) : null,
            has_shower: hasShower,
            has_locker: hasLocker,
            has_parking: hasParking,
            equipment_list: equipmentList.length > 0 ? equipmentList : null,
            photos: facilityPhotos.length > 0 ? facilityPhotos.map((f) => fileLabel(f) as string) : null,
          }
        : null,
      atmosphere: bfAtmosphereText.trim() || null,
      philosophy: bfPhilosophyText.trim() || null,
      programs: finalPrograms,
      free_trial_available: freeTrialAvailable,
      how_it_works_note: bfHowItWorksNote.trim() || null,
      faq_answers: faqAnswers,
    };
  }

  function handlePreview() {
    const answers = isBoutiqueFitness ? buildBoutiqueFitnessAnswers() : buildGeneralAnswers();
    setPreviewJson(JSON.stringify({ vertical, answers }, null, 2));
  }

  if (previewJson) {
    return (
      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 20px 80px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 4px" }}>
          Claude API로 보낼 JSON (미리보기)
        </h1>
        <p style={{ fontSize: 13, color: "#666", margin: "0 0 20px" }}>
          아직 실제로 생성하지 않아요 — 수집된 답변이 이 모양 그대로예요. 이미지는
          업로드 전이라 파일명만 표시됩니다.
        </p>
        <pre
          style={{
            background: "#f5f5f5",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 16,
            fontSize: 12,
            lineHeight: 1.5,
            overflowX: "auto",
            whiteSpace: "pre",
          }}
        >
          {previewJson}
        </pre>
        <button
          type="button"
          onClick={() => setPreviewJson(null)}
          style={{ ...navButtonStyle, ...primaryButtonStyle, marginTop: 16, width: "100%" }}
        >
          다시 수정하기
        </button>
      </main>
    );
  }

  // STEPS[0]은 "업종 선택" 화면 — vertical을 고르기 전까지는 진행률 개념이
  // 성립하지 않으므로(뭘 몇 단계에 걸쳐 물을지 자체가 아직 안 정해짐) 이
  // 단계에서는 진행바를 숨기고, 고른 다음(step 1)부터 1/N으로 다시 센다.
  const totalContentSteps = STEPS.length - 1;
  const contentStep = step; // step 1 -> 1번째 문항 단계

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px 80px" }}>
      {step > 0 && (
        <>
          <p style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
            {contentStep} / {totalContentSteps} · {STEPS[step]}
          </p>
          <div style={{ height: 4, background: "#eee", borderRadius: 2, marginBottom: 28 }}>
            <div
              style={{
                height: "100%",
                width: `${(contentStep / totalContentSteps) * 100}%`,
                background: "#111",
                borderRadius: 2,
                transition: "width 0.2s",
              }}
            />
          </div>
        </>
      )}

      {step === 0 && (
        <Section title="어떤 업종이세요?">
          <Field label="업종 카테고리">
            <select
              value={vertical ?? ""}
              onChange={(e) => setVertical((e.target.value || null) as Vertical | null)}
              autoFocus
            >
              <option value="" disabled>
                선택해주세요
              </option>
              {VERTICALS.map((v) => (
                <option key={v} value={v}>
                  {VERTICAL_LABELS[v].label}
                </option>
              ))}
            </select>
          </Field>
          {vertical && <p style={{ fontSize: 12, color: "#888" }}>{VERTICAL_LABELS[vertical].desc}</p>}
        </Section>
      )}

      {!isBoutiqueFitness && step === 1 && (
        <Section title="어떤 업종이세요?">
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="예: 카페, 미용실, 헬스장, 학원, 병의원, 스터디카페, 장례용품..."
            style={{ fontSize: 16, padding: "14px 12px" }}
          />
        </Section>
      )}

      {!isBoutiqueFitness && step === 2 && (
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

      {!isBoutiqueFitness && step === 3 && (
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

      {!isBoutiqueFitness && step === 4 && (
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

      {!isBoutiqueFitness && step === 5 && (
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

      {!isBoutiqueFitness && step === 6 && (
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

      {isBoutiqueFitness && step === 1 && (
        <Section title="기본 정보">
          <Field label="업종 (한 줄로)">
            <input
              value={bfIndustryCategory}
              onChange={(e) => setBfIndustryCategory(e.target.value)}
              placeholder="예: 필라테스 스튜디오, PT 전문 짐, 요가원"
            />
          </Field>
          <Field label="스튜디오 이름">
            <input value={bfBusinessName} onChange={(e) => setBfBusinessName(e.target.value)} placeholder="예: 지음필라테스" />
          </Field>
          <Field label="지역/주소">
            <input value={bfAddress} onChange={(e) => setBfAddress(e.target.value)} placeholder="예: 서울 강남구 신사동" />
          </Field>
          <Field label="전화번호">
            <input value={bfPhone} onChange={(e) => setBfPhone(e.target.value)} placeholder="02-1234-5678" />
          </Field>

          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>상담·수업 가능 시간대</legend>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>
              예약제로 운영하시면, &quot;문 여는 시간&quot;이 아니라 &quot;상담·수업 잡을 수 있는 시간대&quot;를 알려주세요.
            </p>
            <HoursEditor hours={bfHours} onChange={setBfHours} />
          </fieldset>

          <Field label="상담 문의를 어떤 방식으로 받고 싶으세요?">
            <select value={bfContactMethod} onChange={(e) => setBfContactMethod(e.target.value as typeof bfContactMethod)}>
              <option value="kakao">카카오톡 채널</option>
              <option value="instagram">인스타그램 DM</option>
              <option value="phone">전화</option>
            </select>
          </Field>
          <Field label="카톡·인스타 링크가 있으면 입력해주세요 (선택)">
            <input value={bfContactLink} onChange={(e) => setBfContactLink(e.target.value)} placeholder="https://..." />
          </Field>

          <Field label="대표 사진">
            <input
              type="file"
              accept="image/*"
              style={fileInputStyle}
              onChange={(e) => setBfHeroFile(e.target.files?.[0] ?? null)}
            />
            {bfHeroFile && <p style={fileNameStyle}>선택됨: {bfHeroFile.name}</p>}
          </Field>
          <Field label="로고">
            <input
              type="file"
              accept="image/*"
              style={fileInputStyle}
              onChange={(e) => setBfLogoFile(e.target.files?.[0] ?? null)}
            />
            {bfLogoFile && <p style={fileNameStyle}>선택됨: {bfLogoFile.name}</p>}
          </Field>

          <Field label="손님이 가장 먼저 하길 바라는 행동">
            <select value={bfCtaPrimaryAction} onChange={(e) => setBfCtaPrimaryAction(e.target.value as CtaPrimaryAction)}>
              <option value="call">전화</option>
              <option value="reservation">예약</option>
              <option value="direction">방문·길찾기</option>
            </select>
          </Field>
          <Field label="문의는 버튼으로 바로 연결할까요, 사람이 직접 응대할까요?">
            <select
              value={bfCtaInteractionMode}
              onChange={(e) => setBfCtaInteractionMode(e.target.value as CtaInteractionMode)}
            >
              <option value="guided">DM·카톡 등 사람이 직접 응대</option>
              <option value="functional">버튼으로 바로 연결(전화 걸기, 예약 링크 등)</option>
            </select>
          </Field>

          <Field
            label="손님께 가장 먼저 자신 있게 보여주고 싶은 게 있다면요? (선택)"
            hint="고르지 않으셔도 괜찮아요. 저희가 알아서 가장 설득력 있는 순서로 배치해드려요."
          >
            <select value={bfLeadEmphasis} onChange={(e) => setBfLeadEmphasis(e.target.value as typeof bfLeadEmphasis)}>
              <option value="">고르지 않음</option>
              <option value="transformations">회원 변화 사례</option>
              <option value="reviews">후기</option>
              <option value="professionals">트레이너 경력</option>
              <option value="facility">시설</option>
            </select>
          </Field>
        </Section>
      )}

      {isBoutiqueFitness && step === 2 && (
        <Section title="전문가 프로필 (필수)">
          <p style={{ fontSize: 13, color: "#666", margin: "-8px 0 0" }}>
            이 정보가 홈페이지의 핵심이에요. 손님들은 &quot;어떤 공간인가&quot;보다 &quot;누구에게 배우는가&quot;를 더 궁금해합니다.
          </p>
          {professionals.map((p, i) => (
            <fieldset key={i} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <legend style={{ fontSize: 13, fontWeight: 700 }}>트레이너 {i + 1}</legend>
              <input placeholder="이름" value={p.name} onChange={(e) => updateProfessional(i, { name: e.target.value })} />
              <input
                placeholder="직함 (예: 대표 트레이너, 강사, 원장)"
                value={p.title}
                onChange={(e) => updateProfessional(i, { title: e.target.value })}
              />
              <input
                type="file"
                accept="image/*"
                style={fileInputStyle}
                onChange={(e) => updateProfessional(i, { photo: e.target.files?.[0] ?? null })}
              />
              {p.photo && <p style={fileNameStyle}>선택됨: {p.photo.name}</p>}
              <input
                placeholder="보유 자격증 (쉼표로 구분, 없으면 비워두세요)"
                value={p.certificationsText}
                onChange={(e) => updateProfessional(i, { certificationsText: e.target.value })}
              />
              <input
                placeholder="전문 분야 (예: 체형교정, 재활, 다이어트)"
                value={p.specialty}
                onChange={(e) => updateProfessional(i, { specialty: e.target.value })}
              />
              <input
                placeholder="지도 경력(년 수)"
                value={p.yearsExperience}
                onChange={(e) => updateProfessional(i, { yearsExperience: e.target.value })}
                style={{ width: 140 }}
              />
              <input
                placeholder="지도 철학·스타일 한 줄 (선택)"
                value={p.bioQuote}
                onChange={(e) => updateProfessional(i, { bioQuote: e.target.value })}
              />
            </fieldset>
          ))}
          <button
            type="button"
            onClick={() =>
              setProfessionals((prev) => [
                ...prev,
                { name: "", title: "", photo: null, certificationsText: "", specialty: "", yearsExperience: "", bioQuote: "" },
              ])
            }
            style={{ fontSize: 13 }}
          >
            + 트레이너 추가
          </button>
        </Section>
      )}

      {isBoutiqueFitness && step === 3 && (
        <Section title="회원 변화 사례·후기 (선택이지만 강력 권장)">
          <p style={{ fontSize: 13, color: "#666", margin: "-8px 0 0" }}>
            솔직히 말씀드리면, 이 두 가지가 홈페이지 설득력의 8할을 좌우해요. 시간이 되실 때 1개라도 채워주시면 결과물이 확실히 달라집니다.
          </p>

          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>회원 변화 사례 (1~4개 권장)</legend>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>
              ⚠️ 회원님께 미리 동의를 받은 사진만 올려주세요 — 나중에 문제가 될 수 있어요.
            </p>
            {transformations.map((t, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid #eee" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={fileInputStyle}
                      onChange={(e) => updateTransformation(i, { beforeImage: e.target.files?.[0] ?? null })}
                    />
                    {t.beforeImage && <p style={fileNameStyle}>Before: {t.beforeImage.name}</p>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <input
                      type="file"
                      accept="image/*"
                      style={fileInputStyle}
                      onChange={(e) => updateTransformation(i, { afterImage: e.target.files?.[0] ?? null })}
                    />
                    {t.afterImage && <p style={fileNameStyle}>After: {t.afterImage.name}</p>}
                  </div>
                </div>
                <input
                  placeholder="기간 (예: 12주)"
                  value={t.durationLabel}
                  onChange={(e) => updateTransformation(i, { durationLabel: e.target.value })}
                />
                <input
                  placeholder="핵심 변화 (예: 체지방률 6%p 감소)"
                  value={t.resultHighlight}
                  onChange={(e) => updateTransformation(i, { resultHighlight: e.target.value })}
                />
                <input
                  placeholder="회원 이름 (익명 처리, 예: 김O영님)"
                  value={t.memberLabel}
                  onChange={(e) => updateTransformation(i, { memberLabel: e.target.value })}
                />
                <input
                  placeholder="담당 트레이너 (선택, 여러 명이면 누가 지도했는지)"
                  value={t.trainerTag}
                  onChange={(e) => updateTransformation(i, { trainerTag: e.target.value })}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setTransformations((prev) => [
                  ...prev,
                  { beforeImage: null, afterImage: null, durationLabel: "", resultHighlight: "", memberLabel: "", trainerTag: "" },
                ])
              }
              style={{ fontSize: 13 }}
            >
              + 사례 추가
            </button>
          </fieldset>

          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>후기 (1~4개, 텍스트로 원문 그대로)</legend>
            {bfReviews.map((r, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <textarea
                  placeholder="후기 내용"
                  rows={2}
                  value={r.body}
                  onChange={(e) => updateBfReview(i, { body: e.target.value })}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="작성자 (예: 김O영)"
                    value={r.author}
                    onChange={(e) => updateBfReview(i, { author: e.target.value })}
                  />
                  <input
                    placeholder="별점 (선택, 1~5)"
                    value={r.rating}
                    onChange={(e) => updateBfReview(i, { rating: e.target.value })}
                    style={{ width: 90 }}
                  />
                </div>
                <input
                  placeholder="어디서 받은 후기인지 (예: 네이버 예약, 카카오맵, 인스타그램 DM)"
                  value={r.source}
                  onChange={(e) => updateBfReview(i, { source: e.target.value })}
                />
                <input
                  placeholder="담당 트레이너 (선택, 후기에 실제 언급된 경우만)"
                  value={r.trainerTag}
                  onChange={(e) => updateBfReview(i, { trainerTag: e.target.value })}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setBfReviews((prev) => [...prev, { body: "", author: "", rating: "", source: "", trainerTag: "" }])
              }
              style={{ fontSize: 13 }}
            >
              + 후기 추가
            </button>
          </fieldset>
        </Section>
      )}

      {isBoutiqueFitness && step === 4 && (
        <Section title="공간 (선택)">
          <Field label="평수 (선택)">
            <input
              value={sizePyeong}
              onChange={(e) => setSizePyeong(e.target.value)}
              placeholder="숫자만 (예: 25)"
              style={{ width: 140 }}
            />
          </Field>
          <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="checkbox" checked={hasShower} onChange={(e) => setHasShower(e.target.checked)} />
              샤워실
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="checkbox" checked={hasLocker} onChange={(e) => setHasLocker(e.target.checked)} />
              개인 라커
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input type="checkbox" checked={hasParking} onChange={(e) => setHasParking(e.target.checked)} />
              주차 가능
            </label>
          </div>
          <Field label="보유 기구 (선택, 쉼표로 구분)">
            <input
              value={equipmentText}
              onChange={(e) => setEquipmentText(e.target.value)}
              placeholder="예: 리포머 5대, 캐딜락 2대"
            />
          </Field>
          <Field label="공간 사진 (선택, 트레이너·시설 사진과 겹치지 않는 분위기 사진)">
            <input
              type="file"
              accept="image/*"
              multiple
              style={fileInputStyle}
              onChange={(e) => setFacilityPhotos(Array.from(e.target.files ?? []))}
            />
            {facilityPhotos.length > 0 && <p style={fileNameStyle}>{facilityPhotos.length}장 선택됨</p>}
          </Field>
          <Field
            label="공간에서 손님들이 특히 좋아하는 부분이 있나요? (선택)"
            hint="이 답변이 있으면 사진만으로는 안 전해지는 이 공간만의 느낌이 문구로 살아나요."
          >
            <textarea
              value={bfAtmosphereText}
              onChange={(e) => setBfAtmosphereText(e.target.value)}
              rows={2}
              placeholder="예: 조용함, 채광, 음악"
            />
          </Field>
          <Field
            label="이 스튜디오를 열게 된 계기가 있나요? (선택)"
            hint="짧아도 좋아요. 이 답변은 눈에 띄는 문구로 따로 강조돼요."
          >
            <textarea
              value={bfPhilosophyText}
              onChange={(e) => setBfPhilosophyText(e.target.value)}
              rows={2}
              placeholder="트레이너 개인 이야기 말고, 이 공간을 만들게 된 이유"
            />
          </Field>
        </Section>
      )}

      {isBoutiqueFitness && step === 5 && (
        <Section title="프로그램·이용방법 (필수 + 선택)">
          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>대표 프로그램</legend>
            {programs.map((p, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <input
                  placeholder="이름 (예: 1:1 PT 1회, 그룹 필라테스 8주 과정)"
                  value={p.name}
                  onChange={(e) => updateProgram(i, { name: e.target.value })}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    placeholder="가격"
                    value={p.price}
                    disabled={p.consult}
                    onChange={(e) => updateProgram(i, { price: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, whiteSpace: "nowrap" }}>
                    <input type="checkbox" checked={p.consult} onChange={(e) => updateProgram(i, { consult: e.target.checked })} />
                    상담 후 안내
                  </label>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPrograms((prev) => [...prev, { name: "", price: "", consult: true }])}
              style={{ fontSize: 13 }}
            >
              + 프로그램 추가
            </button>
          </fieldset>

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <input type="checkbox" checked={freeTrialAvailable} onChange={(e) => setFreeTrialAvailable(e.target.checked)} />
            무료 체험이나 1회 체험 프로그램이 있어요
          </label>

          <Field label="특이한 이용 절차가 있다면 알려주세요 (선택)">
            <textarea
              value={bfHowItWorksNote}
              onChange={(e) => setBfHowItWorksNote(e.target.value)}
              rows={2}
              placeholder="업종 기본 흐름(상담→체험→등록)은 자동으로 만들어져요. 특이한 절차만 적어주세요."
            />
          </Field>

          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>
              자주 묻는 질문이 있다면 적어주세요
            </legend>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>
              &quot;초보자도 가능한가요?&quot; 같은 질문에 대한 답은 특히 강력해요.
            </p>
            {bfFaqPairs.map((pair, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <input
                  placeholder="질문 (예: 환불 규정이 어떻게 되나요?)"
                  value={pair.question}
                  onChange={(e) => updateBfFaqPair(i, { question: e.target.value })}
                />
                <input
                  placeholder="답변"
                  value={pair.answer}
                  onChange={(e) => updateBfFaqPair(i, { answer: e.target.value })}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setBfFaqPairs((prev) => [...prev, { question: "", answer: "" }])}
              style={{ fontSize: 13 }}
            >
              + 질문 추가
            </button>
          </fieldset>
        </Section>
      )}

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
          <button type="button" onClick={handlePreview} style={{ ...navButtonStyle, ...primaryButtonStyle }}>
            보낼 JSON 미리보기
          </button>
        )}
      </div>
    </main>
  );
}

function HoursEditor({
  hours,
  onChange,
}: {
  hours: Record<DayOfWeek, DayHours>;
  onChange: (updater: (prev: Record<DayOfWeek, DayHours>) => Record<DayOfWeek, DayHours>) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {DAYS.map((d) => (
        <div key={d.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <span style={{ width: 20, fontWeight: 700 }}>{d.label}</span>
          <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <input
              type="checkbox"
              checked={hours[d.key].closed}
              onChange={(e) => onChange((prev) => ({ ...prev, [d.key]: { ...prev[d.key], closed: e.target.checked } }))}
            />
            휴무
          </label>
          {!hours[d.key].closed && (
            <>
              <input
                type="time"
                value={hours[d.key].open}
                onChange={(e) => onChange((prev) => ({ ...prev, [d.key]: { ...prev[d.key], open: e.target.value } }))}
              />
              <span>–</span>
              <input
                type="time"
                value={hours[d.key].close}
                onChange={(e) => onChange((prev) => ({ ...prev, [d.key]: { ...prev[d.key], close: e.target.value } }))}
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * 전역 CSS(Tailwind preflight)가 폼 요소에 appearance:none을 적용해서, 이 스타일
 * 없이는 <input type="file">의 네이티브 "파일 선택" 버튼이 아예 안 보인다(빈 공간만
 * 남음). 명시적으로 되돌리고, 항상 보이는 테두리 박스를 씌워 클릭 영역을 분명히 한다.
 */
const fileInputStyle: React.CSSProperties = {
  appearance: "auto",
  display: "block",
  width: "100%",
  padding: "10px",
  borderRadius: 8,
  border: "1px solid #ddd",
  fontSize: 13,
};

const fileNameStyle: React.CSSProperties = { fontSize: 12, color: "#666", marginTop: 4 };

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

/**
 * hint: 선택 문항 옆에 붙이는 짧은 동기 문구(input-questions.md 진행 원칙 —
 * "강요·과장 없이 사실만 담백하게"). 채우면 왜 좋은지를 솔직하게 알려주되,
 * 채우지 않아도 되는 선택 사항이라는 톤은 유지한다.
 */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 13 }}>
      <span style={{ fontWeight: 600 }}>{label}</span>
      {hint && <span style={{ fontSize: 12, color: "#888" }}>{hint}</span>}
      {children}
    </label>
  );
}
