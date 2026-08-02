"use client";

import { useEffect, useState } from "react";
import type { CtaInteractionMode, CtaPrimaryAction, DayOfWeek, ExternalLinkPlatform } from "@/lib/content-types";
import {
  DAYS,
  DraftBanner,
  Field,
  GateIntro,
  HoursEditor,
  ProgressBar,
  Section,
  WizardNav,
  defaultHours,
  type DayHours,
  type FaqPairDraft,
} from "../_shared/form-ui";
import { ManualGenerationFlow, type PendingUpload } from "../_shared/manual-flow";
import { clearDraft, loadDraft, useDebouncedDraftSave } from "../_shared/draft-storage";
import { Accordion, Chip, FileField } from "@/components/ui";

/**
 * 업종 중립 공통 후보 — input-questions.md 진행 원칙 1(업종별 프론트 분기 금지)을
 * 지키기 위해 industry-data.md의 업종별 강점 목록에서 특정 업종에 묶이지 않는
 * 것만 추렸다. 후보를 눌러도, 자유 텍스트 칸에 직접 써도 결과는 같은 strengths
 * 배열로 합쳐진다.
 */
const STRENGTH_CANDIDATES = [
  "주차 가능",
  "예약 가능",
  "반려동물 동반",
  "오래된 운영 연차",
  "프라이빗룸",
  "24시간 운영",
  "역세권",
  "단체 가능",
  "포장 가능",
  "와이파이·콘센트",
];

/** industry-data.md 4장의 업종 중립 FAQ 후보. 질문은 칩으로 고르고, 답은 사장님이 직접 쓴다. */
const FAQ_CANDIDATES = ["주차 되나요?", "예약 필수인가요?", "반려동물 동반 가능한가요?", "단체 가능한가요?", "카드 결제 되나요?"];

/**
 * general vertical 입력 폼. spec/for-frontend/general/input-questions.md의 STEP
 * 구성을 그대로 따른다. 업종은 자유 텍스트로만 받고(축A/B 판단은 이 값이 아니라
 * 스킬이 전체 답변을 보고 내림 — SKILL.md), 이후 문항 라벨은 업종별로 프론트가
 * 미리 분기하지 않고 전부 중립적으로 유지한다("메뉴" 대신 "대표 서비스·상품" 등).
 *
 * 필수 스텝(STEP 1~2, 이 배열의 인덱스 0~2)엔 선택 문항을 절대 끼워 넣지 않는다
 * — 선택 문항은 전부 STEP 3(인덱스 3) 하나의 게이트로 모으고, 게이트 진입
 * 화면에서 통째로 건너뛸 수 있다(진행 원칙 2). 필수 스텝을 마쳐도 축하 신호를
 * 먼저 보여주지 않는다(원칙 7) — Stepper 분모도 게이트를 포함해서 그대로 센다.
 *
 * 톤·레이아웃·카피는 여기서 확정하지 않는다 — 스킬(Claude)이 원본 사업 정보를
 * 보고 직접 판단할 몫이다(generate-content.ts 참고).
 *
 * ⚠️ 클로드 API는 아직 자동 호출하지 않는다 — 마지막 단계에서 실제 이미지
 * 업로드·draft 발급까지 마친 뒤 "보낼 요청 본문"을 화면에 보여주고, 사람이
 * claude.ai 등에 직접 붙여넣어 받은 응답을 다시 붙여넣으면 나머지(보정·검증·
 * 저장)를 수행한다 — ManualGenerationFlow(../_shared/manual-flow.tsx) 참고.
 */

const STEPS = ["기본 정보", "서비스·사진", "더 채우면 좋아요"];
const GATE_STEP = 2;

const DRAFT_KEY = "cornerpage-draft:general";

/**
 * localStorage 임시저장용 스냅샷. File 객체(heroFile·logoFile·menuItems[].image·
 * galleryFiles)는 제외한다 — 문자열만 저장 가능해서 사진은 복원 시 다시 첨부해야 한다.
 */
interface DraftSnapshot {
  step: number;
  industry: string;
  businessName: string;
  address: string;
  phone: string;
  is24h: boolean;
  hours: Record<DayOfWeek, DayHours>;
  ctaPrimaryAction: CtaPrimaryAction;
  intro: string;
  philosophyText: string;
  atmosphereText: string;
  strengthsText: string;
  menuItems: Omit<MenuItemDraft, "image">[];
  links: Record<ExternalLinkPlatform, string>;
  reviews: ReviewDraft[];
  ctaInteractionMode: CtaInteractionMode;
  faqPairs: FaqPairDraft[];
}

interface MenuItemDraft {
  name: string;
  price: string;
  consult: boolean;
  description: string;
  image: File[];
}

interface ReviewDraft {
  body: string;
  author: string;
  rating: string;
}

export default function GeneralCreatePage() {
  const [step, setStep] = useState(0);
  const [gateOpened, setGateOpened] = useState(false);

  const [industry, setIndustry] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [is24h, setIs24h] = useState(false);
  const [hours, setHours] = useState<Record<DayOfWeek, DayHours>>(defaultHours());
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [ctaPrimaryAction, setCtaPrimaryAction] = useState<CtaPrimaryAction>("call");

  const [intro, setIntro] = useState("");
  const [philosophyText, setPhilosophyText] = useState("");
  const [atmosphereText, setAtmosphereText] = useState("");
  const [strengthsText, setStrengthsText] = useState("");

  const [menuItems, setMenuItems] = useState<MenuItemDraft[]>([
    { name: "", price: "", consult: false, description: "", image: [] },
  ]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const [links, setLinks] = useState<Record<ExternalLinkPlatform, string>>({
    instagram: "",
    kakao: "",
    naver_reservation: "",
    blog: "",
  });
  const [reviews, setReviews] = useState<ReviewDraft[]>([{ body: "", author: "", rating: "" }]);
  const [ctaInteractionMode, setCtaInteractionMode] = useState<CtaInteractionMode>("functional");

  const [faqPairs, setFaqPairs] = useState<FaqPairDraft[]>([{ question: "", answer: "" }]);

  const [showManualFlow, setShowManualFlow] = useState(false);

  // localStorage는 서버에 없어서, 초기값을 여기서 바로 읽으면(lazy initializer) 서버는
  // 항상 false로 렌더하고 클라이언트만 true가 될 수 있어 하이드레이션 불일치가 난다.
  // 그래서 항상 false로 시작하고, 마운트 후(rAF로 한 프레임 미뤄 effect 본문에서 곧장
  // setState하는 걸 피함 — react-hooks/set-state-in-effect, TrustStrip.tsx와 동일 패턴)
  // 클라이언트에서만 실제로 있는지 확인한다. 실제 복원은 사용자가 버튼을 눌러야 일어난다 —
  // 조용히 덮어쓰지 않는다.
  const [hasDraft, setHasDraft] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setHasDraft(loadDraft<DraftSnapshot>(DRAFT_KEY) !== null);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  function applyDraft(draft: DraftSnapshot) {
    // STEP "업종"이 STEP 1(기본 정보)로 흡수되면서 STEPS 배열이 줄었다 — 예전
    // draft.step이 새 배열 범위를 벗어날 수 있어 클램프한다.
    setStep(Math.min(draft.step, STEPS.length - 1));
    setIndustry(draft.industry);
    setBusinessName(draft.businessName);
    setAddress(draft.address);
    setPhone(draft.phone);
    setIs24h(draft.is24h);
    setHours(draft.hours);
    setCtaPrimaryAction(draft.ctaPrimaryAction);
    setIntro(draft.intro);
    setPhilosophyText(draft.philosophyText);
    setAtmosphereText(draft.atmosphereText);
    setStrengthsText(draft.strengthsText);
    setMenuItems(draft.menuItems.map((item) => ({ ...item, image: [] })));
    setLinks(draft.links);
    setReviews(draft.reviews);
    setCtaInteractionMode(draft.ctaInteractionMode);
    setFaqPairs(draft.faqPairs);
    setHasDraft(false);
  }

  // 값이 바뀔 때마다(디바운스) 자동저장 — 사진은 제외하고 텍스트 답변만.
  // 마운트 시(첫 렌더)의 저장은 useDebouncedDraftSave 내부에서 건너뛴다 —
  // 안 그러면 페이지를 막 열었을 때의 빈 초기 상태가 곧바로 저장되어, 기존에
  // 남아있던 draft를 사용자가 "이어서 작성"을 누르기도 전에 지워버린다.
  const draftSnapshot: DraftSnapshot = {
    step,
    industry,
    businessName,
    address,
    phone,
    is24h,
    hours,
    ctaPrimaryAction,
    intro,
    philosophyText,
    atmosphereText,
    strengthsText,
    menuItems: menuItems.map((item) => ({
      name: item.name,
      price: item.price,
      consult: item.consult,
      description: item.description,
    })),
    links,
    reviews,
    ctaInteractionMode,
    faqPairs,
  };
  useDebouncedDraftSave(DRAFT_KEY, draftSnapshot);

  function canProceed(): boolean {
    if (step === 0) {
      return (
        industry.trim() !== "" && businessName.trim() !== "" && address.trim() !== "" && phone.trim() !== ""
      );
    }
    if (step === 1) return menuItems.some((item) => item.name.trim() !== "");
    return true;
  }

  function updateMenuItem(i: number, patch: Partial<MenuItemDraft>) {
    setMenuItems((prev) => prev.map((item, idx) => (idx === i ? { ...item, ...patch } : item)));
  }

  function removeMenuItem(i: number) {
    setMenuItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function removeReview(i: number) {
    setReviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateFaqPair(i: number, patch: Partial<FaqPairDraft>) {
    setFaqPairs((prev) => prev.map((pair, idx) => (idx === i ? { ...pair, ...patch } : pair)));
  }

  function removeFaqPair(i: number) {
    setFaqPairs((prev) => prev.filter((_, idx) => idx !== i));
  }

  /** 강점 자유 텍스트를 리스트로 파싱 — 칩 선택 여부 판단과 토글에 공통으로 쓴다. */
  const strengthsList = strengthsText
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  function toggleStrength(candidate: string) {
    const next = strengthsList.includes(candidate)
      ? strengthsList.filter((s) => s !== candidate)
      : [...strengthsList, candidate];
    setStrengthsText(next.join(", "));
  }

  function toggleFaqCandidate(question: string) {
    if (faqPairs.some((p) => p.question.trim() === question)) {
      setFaqPairs((prev) => prev.filter((p) => p.question.trim() !== question));
    } else {
      setFaqPairs((prev) => [...prev.filter((p) => p.question.trim() || p.answer.trim()), { question, answer: "" }]);
    }
  }

  const namedMenuItems = menuItems.filter((item) => item.name.trim());
  // 4-5 메뉴 한 줄 스토리 echo-back용 — 이름 붙은 메뉴 중 최대 2개, 원래 배열
  // index를 유지해야 updateMenuItem(i, ...)로 올바른 항목을 갱신할 수 있다.
  const menuStoryTargets = menuItems
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => item.name.trim())
    .slice(0, 2);

  const pendingUploads: PendingUpload[] = [
    ...(heroFiles[0] ? [{ slot: "hero", file: heroFiles[0] }] : []),
    ...(logoFiles[0] ? [{ slot: "logo", file: logoFiles[0] }] : []),
    ...namedMenuItems.flatMap((item, i) => (item.image[0] ? [{ slot: `menu-${i}`, file: item.image[0] }] : [])),
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
      faq_answers: faqAnswers,
    };
  }

  function handleSubmit() {
    setShowManualFlow(true);
  }

  /** 게이트 진입 화면의 "바로 완료하기" — 이 게이트가 마지막 스텝이므로 곧장 제출로 넘어간다. */
  function skipGate() {
    if (step === STEPS.length - 1) {
      handleSubmit();
    } else {
      setStep((s) => s + 1);
    }
  }

  if (showManualFlow) {
    return (
      <ManualGenerationFlow
        vertical="general"
        pendingUploads={pendingUploads}
        buildAnswers={buildAnswers}
        onBack={() => setShowManualFlow(false)}
        onSaved={() => clearDraft(DRAFT_KEY)}
      />
    );
  }

  return (
    <main className="cp-form mx-auto w-full max-w-[560px] px-5 pt-8 pb-8">
      {hasDraft && (
        <DraftBanner
          onResume={() => {
            const draft = loadDraft<DraftSnapshot>(DRAFT_KEY);
            if (draft) applyDraft(draft);
          }}
          onDiscard={() => {
            clearDraft(DRAFT_KEY);
            setHasDraft(false);
          }}
        />
      )}

      <div className="mb-6">
        <ProgressBar step={step + 1} total={STEPS.length} label={STEPS[step]} />
      </div>

      {step === 0 && (
        <Section title="기본 정보" meta="예상 소요시간 약 1분">
          <Field label="업종">
            <input
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="예: 카페, 미용실, 헬스장, 학원, 병의원, 스터디카페, 장례용품..."
              autoFocus
            />
          </Field>
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

          <FileField label="대표 사진" value={heroFiles} onChange={setHeroFiles} />
          <FileField label="로고" value={logoFiles} onChange={setLogoFiles} />

          <Field label="손님이 가장 먼저 하길 바라는 행동">
            <select value={ctaPrimaryAction} onChange={(e) => setCtaPrimaryAction(e.target.value as CtaPrimaryAction)}>
              <option value="call">전화</option>
              <option value="reservation">예약</option>
              <option value="direction">방문·길찾기</option>
            </select>
          </Field>
        </Section>
      )}

      {step === 1 && (
        <Section title="대표 서비스·상품·사진" meta="예상 소요시간 약 1~2분">
          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>대표 서비스·상품</legend>
            {menuItems.map((item, i) => (
              <div key={i} className="mb-3 flex flex-col gap-1.5 border-b border-cp-border pb-3 last:border-b-0">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    placeholder="이름 (예: 아메리카노, 커트, 개인레슨 1회)"
                    value={item.name}
                    onChange={(e) => updateMenuItem(i, { name: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  {menuItems.length > 1 && (
                    <button type="button" onClick={() => removeMenuItem(i)} className="text-[13px] text-cp-muted">
                      삭제
                    </button>
                  )}
                </div>
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
                <FileField label="사진" value={item.image} onChange={(files) => updateMenuItem(i, { image: files })} />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setMenuItems((prev) => [...prev, { name: "", price: "", consult: false, description: "", image: [] }])
              }
              style={{ fontSize: 13 }}
            >
              + 항목 추가
            </button>
          </fieldset>

          <FileField label="갤러리 사진 (몇 장이든 업로드한 만큼)" multiple value={galleryFiles} onChange={setGalleryFiles} />
        </Section>
      )}

      {step === GATE_STEP && !gateOpened && (
        <GateIntro
          description="여기까지만 하셔도 홈페이지는 완성돼요. 아래는 있으면 더 좋은 것들이에요 — 다 채우면 약 3~4분, 마음에 드는 것만 답하셔도 충분해요."
          fillLabel="몇 개만 더 채우기"
          skipLabel="바로 완료하기"
          onFill={() => setGateOpened(true)}
          onSkip={skipGate}
        />
      )}

      {step === GATE_STEP && gateOpened && (
        <Section title="더 채우면 좋아요">
          <div className="flex flex-col gap-3">
            <Accordion title="강점 체크리스트" hint="가장 빠르게 끝나요">
              <p className="text-[13px] text-cp-muted">
                체크만 하면 끝나요. 이 답이 있으면 &apos;고객만족도 1위&apos; 같은 막연한 문구 대신 실제 근거가 담긴
                신뢰 문구가 만들어져요.
              </p>
              <div className="flex flex-wrap gap-2">
                {STRENGTH_CANDIDATES.map((candidate) => (
                  <Chip key={candidate} selected={strengthsList.includes(candidate)} onClick={() => toggleStrength(candidate)}>
                    {candidate}
                  </Chip>
                ))}
              </div>
              <textarea
                value={strengthsText}
                onChange={(e) => setStrengthsText(e.target.value)}
                rows={2}
                placeholder="해당되는 후보를 누르거나, 쉼표·줄바꿈으로 구분해 직접 적어주세요."
              />
            </Accordion>

            <Accordion title="손님 연결 링크">
              <Field label="인스타그램">
                <input
                  value={links.instagram}
                  onChange={(e) => setLinks((p) => ({ ...p, instagram: e.target.value }))}
                  placeholder="https://instagram.com/..."
                />
              </Field>
              <Field label="카카오">
                <input
                  value={links.kakao}
                  onChange={(e) => setLinks((p) => ({ ...p, kakao: e.target.value }))}
                  placeholder="https://pf.kakao.com/..."
                />
              </Field>
              <Field label="네이버 예약">
                <input
                  value={links.naver_reservation}
                  onChange={(e) => setLinks((p) => ({ ...p, naver_reservation: e.target.value }))}
                  placeholder="https://booking.naver.com/..."
                />
              </Field>
              <Field label="블로그">
                <input
                  value={links.blog}
                  onChange={(e) => setLinks((p) => ({ ...p, blog: e.target.value }))}
                  placeholder="https://blog.naver.com/..."
                />
              </Field>
            </Accordion>

            <Accordion title="예약 방식">
              <Field label="예약·문의 방식">
                <select value={ctaInteractionMode} onChange={(e) => setCtaInteractionMode(e.target.value as CtaInteractionMode)}>
                  <option value="functional">버튼으로 바로 연결(전화 걸기, 예약 링크 등)</option>
                  <option value="guided">DM·카톡 등 사람이 직접 응대</option>
                </select>
              </Field>
            </Accordion>

            <Accordion title="소개 문구">
              <Field label="한 줄 소개나 가게 소개 문구가 있으면 알려주세요">
                <textarea
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  rows={3}
                  placeholder="2015년부터 이 자리에서 원두를 직접 로스팅합니다"
                />
              </Field>
            </Accordion>

            {menuStoryTargets.length > 0 && (
              <Accordion title="메뉴 한 줄 스토리">
                {menuStoryTargets.map(({ item, i }) => (
                  <Field
                    key={i}
                    label={`[${item.name}]이 특별한 이유가 있나요?`}
                    hint="이 한 줄이 있고 없고에 따라 메뉴 설명이 '정성으로 만든 메뉴'처럼 뻔해지느냐, 진짜 구체적인 이야기가 되느냐가 갈려요."
                  >
                    <input
                      placeholder="재료 원산지·만드는 방식·다른 곳과의 차이 등"
                      value={item.description}
                      onChange={(e) => updateMenuItem(i, { description: e.target.value })}
                    />
                  </Field>
                ))}
              </Accordion>
            )}

            <Accordion title="시작하게 된 계기">
              <Field
                label="이 일을 시작하게 된 계기나 철학이 있나요?"
                hint="짧아도 좋아요. 이 답변은 소개 문단에 섞이지 않고 눈에 띄는 문구로 따로 강조돼요."
              >
                <textarea
                  value={philosophyText}
                  onChange={(e) => setPhilosophyText(e.target.value)}
                  rows={2}
                  placeholder="부모님이 하시던 가게를 물려받아 10년째 이어가고 있어요"
                />
              </Field>
            </Accordion>

            <Accordion title="공간·분위기">
              <Field
                label="공간·분위기에서 손님들이 특히 좋아하는 부분이 있나요?"
                hint="이 답변이 있으면 '정성으로 준비했습니다' 같은 뻔한 문장 대신, 진짜 이 가게만의 분위기가 전달돼요."
              >
                <textarea
                  value={atmosphereText}
                  onChange={(e) => setAtmosphereText(e.target.value)}
                  rows={2}
                  placeholder="창가 자리가 햇살이 잘 들어서 특히 인기가 많아요"
                />
              </Field>
            </Accordion>

            <Accordion title="리뷰" hint="가장 손이 많이 가는 항목이라 마지막에">
              <p className="text-[13px] text-cp-muted">리뷰가 있으면 내용을 1~2개 붙여주세요(원문 그대로).</p>
              {reviews.map((r, i) => (
                <div key={i} className="flex flex-col gap-1.5 border-b border-cp-border pb-3 last:border-b-0">
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
                    <button type="button" onClick={() => removeReview(i)} className="flex-none text-[13px] text-cp-muted">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setReviews((prev) => [...prev, { body: "", author: "", rating: "" }])}
                style={{ fontSize: 13 }}
              >
                + 리뷰 추가
              </button>
            </Accordion>

            <Accordion title="FAQ">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-cp-fg">자주 묻는 질문이 있다면 적어주세요</p>
                <div className="flex flex-wrap gap-2">
                  {FAQ_CANDIDATES.map((question) => (
                    <Chip
                      key={question}
                      selected={faqPairs.some((p) => p.question.trim() === question)}
                      onClick={() => toggleFaqCandidate(question)}
                    >
                      {question}
                    </Chip>
                  ))}
                </div>
                {faqPairs.map((pair, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        placeholder="질문 (예: 주차 되나요?)"
                        value={pair.question}
                        onChange={(e) => updateFaqPair(i, { question: e.target.value })}
                        style={{ flex: 1 }}
                      />
                      <button type="button" onClick={() => removeFaqPair(i)} className="flex-none text-[13px] text-cp-muted">
                        삭제
                      </button>
                    </div>
                    <input placeholder="답변" value={pair.answer} onChange={(e) => updateFaqPair(i, { answer: e.target.value })} />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFaqPairs((prev) => [...prev, { question: "", answer: "" }])}
                  style={{ fontSize: 13 }}
                >
                  + 질문 추가
                </button>
              </div>
            </Accordion>
          </div>
        </Section>
      )}

      <WizardNav
        step={step}
        isLastStep={step === STEPS.length - 1}
        canProceed={canProceed()}
        onBack={() => setStep((s) => s - 1)}
        onNext={() => setStep((s) => s + 1)}
        onSubmit={handleSubmit}
        hidePrimary={step === GATE_STEP && !gateOpened}
      />
    </main>
  );
}
