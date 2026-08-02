"use client";

import { useEffect, useState } from "react";
import type { DayOfWeek } from "@/lib/content-types";
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

/** industry-data.md 3장의 업종 중립 FAQ 후보. 질문은 칩으로 고르고, 답은 사장님이 직접 쓴다. */
const FAQ_CANDIDATES = ["주차 되나요?", "예약 필수인가요?", "반려동물 동반 가능한가요?", "단체 가능한가요?", "카드 결제 되나요?"];

/**
 * boutique-fitness vertical 입력 폼. spec/for-frontend/boutique-fitness/
 * input-questions.md의 STEP 구성을 그대로 따른다 — general과 스키마 자체가
 * 달라서(신규 블록 3종·meta 구조 변경 등, generate-content.ts 참고) 질문 흐름도
 * 완전히 분리된 라우트다.
 *
 * 필수 스텝(인덱스 0~2)엔 선택 문항을 끼워 넣지 않는다. 선택 문항은 두 게이트로
 * 나뉜다 — STEP 5(인덱스 3, 회원 변화·후기)는 "직접 증거"라 사실상 필수급이라서
 * 독립된 자체 게이트를 갖고, 나머지 저가치 선택 항목(시설정보·사업자정보·슬로건
 * 등)은 STEP 6(인덱스 4) 하나의 통합 게이트로 몰았다(definition.md 4장 — 이
 * 둘을 같은 게이트에 묶으면 채움률이 떨어질 위험). 새 선택 항목을 추가할 땐
 * "이게 STEP5급 가치인가 STEP6급인가"부터 판단해서 배치할 것 — 전부 STEP6에
 * 몰아넣지 않는 게 이 설계의 핵심이다.
 *
 * meta.cta_primary_action/cta_interaction_mode(general 개념)는 이 vertical에
 * 없다 — 대신 meta.inquiry_channels(예약·문의 채널, 최소 1개 복수 선택)와
 * meta.browse_channels(둘러보기 채널, 복수 선택·선택)로 대체됐다(2026-07-18
 * 스키마 변경). 버튼 하나=행동 하나가 아니라, 버튼을 누르면 다이얼로그가 열려
 * 고른 채널들을 나열하는 구조 — 채널별 표시 문구·아이콘은 렌더러가 type 값으로
 * 고정 템플릿 렌더링하고 스킬은 만들지 않는다.
 *
 * ⚠️ 클로드 API는 아직 자동 호출하지 않는다 — 마지막 단계에서 실제 이미지
 * 업로드·draft 발급까지 마친 뒤 "보낼 요청 본문"을 화면에 보여주고, 사람이
 * claude.ai 등에 직접 붙여넣어 받은 응답을 다시 붙여넣으면 나머지(보정·검증·
 * 저장)를 수행한다 — ManualGenerationFlow(../_shared/manual-flow.tsx) 참고.
 * POST /api/sites/manual은 RENDERER_READY_VERTICALS 게이트를 적용하지 않아서
 * boutique-fitness도 실제로 저장까지 된다 — 다만 렌더러가 아직 이 vertical의
 * 새 블록을 못 그려서, 저장된 사이트를 지금 방문하면 깨진다(2026-07-19 결정,
 * 테스트 목적으로 감수).
 */

const STEPS = ["기본 정보", "전문가 프로필", "프로그램·이용방법", "회원 변화·후기", "더 채우면 좋아요"];
const GATE5_STEP = 3;
const GATE6_STEP = 4;

const DRAFT_KEY = "cornerpage-draft:boutique-fitness";

/**
 * localStorage 임시저장용 스냅샷. File 객체(heroFiles·logoFiles·facilityPhotos·
 * professionals[].photo·transformations[].beforeImage/afterImage)는 제외한다 —
 * 문자열만 저장 가능해서 사진은 복원 시 다시 첨부해야 한다.
 */
interface DraftSnapshot {
  step: number;
  industryCategory: string;
  businessName: string;
  signaturePhrase: string;
  address: string;
  phone: string;
  hours: Record<DayOfWeek, DayHours>;
  naverReservationLink: string;
  kakaoLink: DualPurposeLinkDraft;
  instagramLink: DualPurposeLinkDraft;
  naverBlogLink: string;
  youtubeLink: string;
  naverMapLink: string;
  otherLinks: OtherLinkDraft[];
  registeredName: string;
  ceoName: string;
  registrationNumber: string;
  leadEmphasis: "" | "transformations" | "reviews" | "professionals" | "facility";
  professionals: Omit<ProfessionalDraft, "photo">[];
  transformations: Omit<TransformationDraft, "beforeImage" | "afterImage">[];
  reviews: BfReviewDraft[];
  sizePyeong: string;
  hasShower: boolean;
  hasLocker: boolean;
  hasParking: boolean;
  equipmentText: string;
  landmarkDistance: string;
  atmosphereText: string;
  philosophyText: string;
  programs: ProgramDraft[];
  freeTrialAvailable: boolean;
  faqPairs: FaqPairDraft[];
}

/**
 * 2026-07-19 링크 입력 재설계(spec/for-frontend/boutique-fitness/input-questions.md STEP 2):
 * 예전엔 문의 채널·둘러보기 채널을 완전히 분리된 두 체크리스트로 받아서, 카카오톡/인스타그램처럼
 * 두 역할을 겸하는 링크는 똑같은 URL을 두 번 입력해야 했다. 이제 플랫폼당 링크 입력 하나뿐이고,
 * 채널 성격이 고정된 플랫폼(네이버예약=문의 전용, 네이버블로그·유튜브·네이버지도=둘러보기 전용)은
 * 입력하는 즉시 자동 분류된다. 카카오톡·인스타그램만 둘 다로 쓰일 수 있어 체크박스로 문의 겸용
 * 여부를 고르게 한다(기본 체크 — 링크는 항상 browse_channels에도 들어간다).
 */
interface DualPurposeLinkDraft {
  url: string;
  alsoInquiry: boolean;
}

interface OtherLinkDraft {
  url: string;
  label: string;
  forInquiry: boolean;
  forBrowse: boolean;
}

interface ProfessionalDraft {
  name: string;
  title: string;
  photo: File[];
  certificationsText: string;
  specialty: string;
  yearsExperience: string;
  bioQuote: string;
}

interface TransformationDraft {
  beforeImage: File[];
  afterImage: File[];
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

export default function BoutiqueFitnessCreatePage() {
  const [step, setStep] = useState(0);
  const [gate5Opened, setGate5Opened] = useState(false);
  const [gate6Opened, setGate6Opened] = useState(false);

  const [industryCategory, setIndustryCategory] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [signaturePhrase, setSignaturePhrase] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [hours, setHours] = useState<Record<DayOfWeek, DayHours>>(defaultHours());
  const [naverReservationLink, setNaverReservationLink] = useState("");
  const [kakaoLink, setKakaoLink] = useState<DualPurposeLinkDraft>({ url: "", alsoInquiry: true });
  const [instagramLink, setInstagramLink] = useState<DualPurposeLinkDraft>({ url: "", alsoInquiry: true });
  const [naverBlogLink, setNaverBlogLink] = useState("");
  const [youtubeLink, setYoutubeLink] = useState("");
  const [naverMapLink, setNaverMapLink] = useState("");
  const [otherLinks, setOtherLinks] = useState<OtherLinkDraft[]>([
    { url: "", label: "", forInquiry: false, forBrowse: false },
  ]);
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
  const [logoFiles, setLogoFiles] = useState<File[]>([]);
  const [registeredName, setRegisteredName] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [leadEmphasis, setLeadEmphasis] = useState<
    "" | "transformations" | "reviews" | "professionals" | "facility"
  >("");

  const [professionals, setProfessionals] = useState<ProfessionalDraft[]>([
    { name: "", title: "", photo: [], certificationsText: "", specialty: "", yearsExperience: "", bioQuote: "" },
  ]);

  const [transformations, setTransformations] = useState<TransformationDraft[]>([
    { beforeImage: [], afterImage: [], durationLabel: "", resultHighlight: "", memberLabel: "", trainerTag: "" },
  ]);
  const [reviews, setReviews] = useState<BfReviewDraft[]>([
    { body: "", author: "", rating: "", source: "", trainerTag: "" },
  ]);

  const [sizePyeong, setSizePyeong] = useState("");
  const [hasShower, setHasShower] = useState(false);
  const [hasLocker, setHasLocker] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [equipmentText, setEquipmentText] = useState("");
  const [facilityPhotos, setFacilityPhotos] = useState<File[]>([]);
  const [landmarkDistance, setLandmarkDistance] = useState("");
  const [atmosphereText, setAtmosphereText] = useState("");
  const [philosophyText, setPhilosophyText] = useState("");

  const [programs, setPrograms] = useState<ProgramDraft[]>([{ name: "", price: "", consult: true }]);
  const [freeTrialAvailable, setFreeTrialAvailable] = useState(false);
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
    setStep(draft.step);
    setIndustryCategory(draft.industryCategory);
    setBusinessName(draft.businessName);
    setSignaturePhrase(draft.signaturePhrase);
    setAddress(draft.address);
    setPhone(draft.phone);
    setHours(draft.hours);
    setNaverReservationLink(draft.naverReservationLink);
    setKakaoLink(draft.kakaoLink);
    setInstagramLink(draft.instagramLink);
    setNaverBlogLink(draft.naverBlogLink);
    setYoutubeLink(draft.youtubeLink);
    setNaverMapLink(draft.naverMapLink);
    setOtherLinks(draft.otherLinks);
    setRegisteredName(draft.registeredName);
    setCeoName(draft.ceoName);
    setRegistrationNumber(draft.registrationNumber);
    setLeadEmphasis(draft.leadEmphasis);
    setProfessionals(draft.professionals.map((p) => ({ ...p, photo: [] })));
    setTransformations(draft.transformations.map((t) => ({ ...t, beforeImage: [], afterImage: [] })));
    setReviews(draft.reviews);
    setSizePyeong(draft.sizePyeong);
    setHasShower(draft.hasShower);
    setHasLocker(draft.hasLocker);
    setHasParking(draft.hasParking);
    setEquipmentText(draft.equipmentText);
    setLandmarkDistance(draft.landmarkDistance);
    setAtmosphereText(draft.atmosphereText);
    setPhilosophyText(draft.philosophyText);
    setPrograms(draft.programs);
    setFreeTrialAvailable(draft.freeTrialAvailable);
    setFaqPairs(draft.faqPairs);
    setHasDraft(false);
  }

  // 값이 바뀔 때마다(디바운스) 자동저장 — 사진은 제외하고 텍스트 답변만.
  // 마운트 시(첫 렌더)의 저장은 useDebouncedDraftSave 내부에서 건너뛴다 —
  // 안 그러면 페이지를 막 열었을 때의 빈 초기 상태가 곧바로 저장되어, 기존에
  // 남아있던 draft를 사용자가 "이어서 작성"을 누르기도 전에 지워버린다.
  const draftSnapshot: DraftSnapshot = {
    step,
    industryCategory,
    businessName,
    signaturePhrase,
    address,
    phone,
    hours,
    naverReservationLink,
    kakaoLink,
    instagramLink,
    naverBlogLink,
    youtubeLink,
    naverMapLink,
    otherLinks,
    registeredName,
    ceoName,
    registrationNumber,
    leadEmphasis,
    professionals: professionals.map((p) => ({
      name: p.name,
      title: p.title,
      certificationsText: p.certificationsText,
      specialty: p.specialty,
      yearsExperience: p.yearsExperience,
      bioQuote: p.bioQuote,
    })),
    transformations: transformations.map((t) => ({
      durationLabel: t.durationLabel,
      resultHighlight: t.resultHighlight,
      memberLabel: t.memberLabel,
      trainerTag: t.trainerTag,
    })),
    reviews,
    sizePyeong,
    hasShower,
    hasLocker,
    hasParking,
    equipmentText,
    landmarkDistance,
    atmosphereText,
    philosophyText,
    programs,
    freeTrialAvailable,
    faqPairs,
  };
  useDebouncedDraftSave(DRAFT_KEY, draftSnapshot);

  function canProceed(): boolean {
    if (step === 0) {
      // 전화번호는 항상 call 문의 채널로 자동 등록되므로, 별도의 "문의 채널 최소 1개" 체크가 불필요하다.
      return (
        industryCategory.trim() !== "" &&
        businessName.trim() !== "" &&
        address.trim() !== "" &&
        phone.trim() !== ""
      );
    }
    if (step === 1) return professionals.some((p) => p.name.trim() !== "");
    if (step === 2) return programs.some((p) => p.name.trim() !== "");
    return true;
  }

  function buildInquiryChannels() {
    const list: { type: string; action_value: string; other_label: string | null }[] = [];
    if (phone.trim()) list.push({ type: "call", action_value: phone.trim(), other_label: null });
    if (naverReservationLink.trim())
      list.push({ type: "naver_reservation", action_value: naverReservationLink.trim(), other_label: null });
    if (kakaoLink.url.trim() && kakaoLink.alsoInquiry)
      list.push({ type: "kakao", action_value: kakaoLink.url.trim(), other_label: null });
    if (instagramLink.url.trim() && instagramLink.alsoInquiry)
      list.push({ type: "instagram_dm", action_value: instagramLink.url.trim(), other_label: null });
    otherLinks
      .filter((o) => o.url.trim() && o.label.trim() && o.forInquiry)
      .forEach((o) => list.push({ type: "other", action_value: o.url.trim(), other_label: o.label.trim() }));
    return list;
  }

  function buildBrowseChannels() {
    const list: { type: string; action_value: string; other_label: string | null }[] = [];
    if (kakaoLink.url.trim()) list.push({ type: "kakao", action_value: kakaoLink.url.trim(), other_label: null });
    if (naverBlogLink.trim())
      list.push({ type: "naver_blog", action_value: naverBlogLink.trim(), other_label: null });
    if (instagramLink.url.trim())
      list.push({ type: "instagram", action_value: instagramLink.url.trim(), other_label: null });
    if (youtubeLink.trim()) list.push({ type: "youtube", action_value: youtubeLink.trim(), other_label: null });
    if (naverMapLink.trim()) list.push({ type: "naver_map", action_value: naverMapLink.trim(), other_label: null });
    otherLinks
      .filter((o) => o.url.trim() && o.label.trim() && o.forBrowse)
      .forEach((o) => list.push({ type: "other", action_value: o.url.trim(), other_label: o.label.trim() }));
    return list.length > 0 ? list : null;
  }

  function updateOtherLink(i: number, patch: Partial<OtherLinkDraft>) {
    setOtherLinks((prev) => prev.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }

  function removeOtherLink(i: number) {
    setOtherLinks((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateProfessional(i: number, patch: Partial<ProfessionalDraft>) {
    setProfessionals((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function removeProfessional(i: number) {
    setProfessionals((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateTransformation(i: number, patch: Partial<TransformationDraft>) {
    setTransformations((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function removeTransformation(i: number) {
    setTransformations((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateReview(i: number, patch: Partial<BfReviewDraft>) {
    setReviews((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeReview(i: number) {
    setReviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateProgram(i: number, patch: Partial<ProgramDraft>) {
    setPrograms((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function removeProgram(i: number) {
    setPrograms((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateFaqPair(i: number, patch: Partial<FaqPairDraft>) {
    setFaqPairs((prev) => prev.map((pair, idx) => (idx === i ? { ...pair, ...patch } : pair)));
  }

  function removeFaqPair(i: number) {
    setFaqPairs((prev) => prev.filter((_, idx) => idx !== i));
  }

  function toggleFaqCandidate(question: string) {
    if (faqPairs.some((p) => p.question.trim() === question)) {
      setFaqPairs((prev) => prev.filter((p) => p.question.trim() !== question));
    } else {
      setFaqPairs((prev) => [...prev.filter((p) => p.question.trim() || p.answer.trim()), { question, answer: "" }]);
    }
  }

  const finalProfessionalsList = professionals.filter((p) => p.name.trim());
  const finalTransformationsList = transformations.filter(
    (t) => t.beforeImage[0] || t.afterImage[0] || t.resultHighlight.trim()
  );

  const pendingUploads: PendingUpload[] = [
    ...heroFiles.map((file, i) => ({ slot: `hero-${i}`, file })),
    ...(logoFiles[0] ? [{ slot: "logo", file: logoFiles[0] }] : []),
    ...finalProfessionalsList.flatMap((p, i) => (p.photo[0] ? [{ slot: `professional-${i}-photo`, file: p.photo[0] }] : [])),
    ...finalTransformationsList.flatMap((t, i) => [
      ...(t.beforeImage[0] ? [{ slot: `transformation-${i}-before`, file: t.beforeImage[0] }] : []),
      ...(t.afterImage[0] ? [{ slot: `transformation-${i}-after`, file: t.afterImage[0] }] : []),
    ]),
    ...facilityPhotos.map((file, i) => ({ slot: `facility-${i}`, file })),
  ];

  function buildAnswers(urls: Record<string, string>) {
    const finalProfessionals = finalProfessionalsList.map((p, i) => ({
      name: p.name.trim(),
      title: p.title.trim(),
      photo_url: urls[`professional-${i}-photo`] ?? null,
      certifications: p.certificationsText
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
      specialty: p.specialty.trim(),
      years_experience: p.yearsExperience.trim() ? Number(p.yearsExperience) : null,
      bio_quote: p.bioQuote.trim() || null,
    }));

    const finalTransformations = finalTransformationsList.map((t, i) => ({
      before_image_url: urls[`transformation-${i}-before`] ?? null,
      after_image_url: urls[`transformation-${i}-after`] ?? null,
      duration_label: t.durationLabel.trim(),
      result_highlight: t.resultHighlight.trim(),
      member_label: t.memberLabel.trim(),
      trainer_tag: t.trainerTag.trim() || null,
    }));

    const finalReviews = reviews
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
      sizePyeong.trim() ||
      hasShower ||
      hasLocker ||
      hasParking ||
      equipmentList.length > 0 ||
      facilityPhotos.length > 0 ||
      atmosphereText.trim();

    const faqAnswers = faqPairs
      .filter((pair) => pair.question.trim() && pair.answer.trim())
      .map((pair) => ({ question: pair.question.trim(), answer: pair.answer.trim() }));

    const finalPrograms = programs
      .filter((p) => p.name.trim())
      .map((p) => ({ name: p.name.trim(), price: p.consult ? null : p.price.trim() || null }));

    return {
      industry_category: industryCategory,
      business_name: businessName,
      // 스키마 필드가 아니라 입력 힌트 — Claude가 새로 창작하지 않고 이 문구를
      // 그대로 hero.headline에 살리도록 프롬프트(answers)에만 실어 보낸다.
      signature_phrase: signaturePhrase.trim() || null,
      address,
      phone,
      consult_hours: {
        type: "structured" as const,
        structured: DAYS.map((d) => ({
          day: d.key,
          open: hours[d.key].closed ? null : hours[d.key].open,
          close: hours[d.key].closed ? null : hours[d.key].close,
          closed: hours[d.key].closed,
        })),
      },
      inquiry_channels: buildInquiryChannels(),
      browse_channels: buildBrowseChannels(),
      hero_image_urls: heroFiles.map((_, i) => urls[`hero-${i}`]).filter((u): u is string => !!u),
      logo_url: urls["logo"] ?? null,
      business_info:
        registeredName.trim() && ceoName.trim() && registrationNumber.trim()
          ? {
              registered_name: registeredName.trim(),
              ceo_name: ceoName.trim(),
              registration_number: registrationNumber.trim(),
            }
          : null,
      lead_emphasis: leadEmphasis || null,
      professionals: finalProfessionals,
      transformations: finalTransformations,
      reviews: finalReviews,
      facility: hasFacilityData
        ? {
            size_pyeong: sizePyeong.trim() ? Number(sizePyeong) : null,
            has_shower: hasShower,
            has_locker: hasLocker,
            has_parking: hasParking,
            equipment_list: equipmentList.length > 0 ? equipmentList : null,
            photos:
              facilityPhotos.length > 0
                ? facilityPhotos.map((_, i) => urls[`facility-${i}`]).filter((u): u is string => !!u)
                : null,
            atmosphere_text: atmosphereText.trim() || null,
          }
        : null,
      landmark_distance: landmarkDistance.trim() || null,
      philosophy: philosophyText.trim() || null,
      programs: finalPrograms,
      free_trial_available: freeTrialAvailable,
      faq_answers: faqAnswers,
    };
  }

  function handleSubmit() {
    setShowManualFlow(true);
  }

  /** 게이트 진입 화면의 스킵 — 마지막 스텝(STEP6)이면 곧장 제출, 아니면 다음 스텝(STEP6)으로. */
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
        vertical="boutique-fitness"
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
        <Section title="기본 정보" meta="예상 소요시간 약 1~2분">
          <Field label="업종 (한 줄로)">
            <input
              value={industryCategory}
              onChange={(e) => setIndustryCategory(e.target.value)}
              placeholder="예: 필라테스 스튜디오, PT 전문 짐, 요가원"
              autoFocus
            />
          </Field>
          <Field label="스튜디오 이름">
            <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="예: 지음필라테스" />
          </Field>
          <Field label="지역/주소">
            <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="예: 서울 강남구 신사동" />
          </Field>
          <Field label="전화번호">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="02-1234-5678" />
          </Field>

          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>상담·수업 가능 시간대</legend>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>
              예약제로 운영하시면, &quot;문 여는 시간&quot;이 아니라 &quot;상담·수업 잡을 수 있는 시간대&quot;를 알려주세요.
            </p>
            <HoursEditor hours={hours} onChange={setHours} />
          </fieldset>

          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>링크</legend>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>
              전화번호는 이미 위에서 받았으니 자동으로 문의 채널에 등록돼요. 카카오톡·인스타그램은 상담 창구로도,
              둘러보기 채널로도 자주 쓰이더라고요 — 체크박스는 편하신 대로 기본 체크해뒀으니, 다르게 쓰고 싶으실 때만
              바꿔주세요.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 13, width: 96, flexShrink: 0 }}>네이버지도</label>
                <input
                  placeholder="https://naver.me/..."
                  value={naverMapLink}
                  onChange={(e) => setNaverMapLink(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 13, width: 96, flexShrink: 0 }}>네이버예약</label>
                <input
                  placeholder="https://booking.naver.com/..."
                  value={naverReservationLink}
                  onChange={(e) => setNaverReservationLink(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, width: 96, flexShrink: 0 }}>카카오톡 채널</label>
                  <input
                    placeholder="https://pf.kakao.com/..."
                    value={kakaoLink.url}
                    onChange={(e) => setKakaoLink((prev) => ({ ...prev, url: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    marginTop: 4,
                    marginLeft: 104,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={kakaoLink.alsoInquiry}
                    onChange={(e) => setKakaoLink((prev) => ({ ...prev, alsoInquiry: e.target.checked }))}
                  />
                  이 링크로 문의도 받고 싶어요
                </label>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <label style={{ fontSize: 13, width: 96, flexShrink: 0 }}>인스타그램</label>
                  <input
                    placeholder="https://instagram.com/..."
                    value={instagramLink.url}
                    onChange={(e) => setInstagramLink((prev) => ({ ...prev, url: e.target.value }))}
                    style={{ flex: 1 }}
                  />
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    marginTop: 4,
                    marginLeft: 104,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={instagramLink.alsoInquiry}
                    onChange={(e) => setInstagramLink((prev) => ({ ...prev, alsoInquiry: e.target.checked }))}
                  />
                  이 링크로 문의(DM)도 받고 싶어요
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 13, width: 96, flexShrink: 0 }}>유튜브</label>
                <input
                  placeholder="https://youtube.com/..."
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <label style={{ fontSize: 13, width: 96, flexShrink: 0 }}>네이버블로그</label>
                <input
                  placeholder="https://blog.naver.com/..."
                  value={naverBlogLink}
                  onChange={(e) => setNaverBlogLink(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>

              {otherLinks.map((o, i) => (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 13, width: 96, flexShrink: 0 }}>
                      기타 링크 {otherLinks.length > 1 ? i + 1 : ""}
                    </label>
                    <input
                      placeholder="링크"
                      value={o.url}
                      onChange={(e) => updateOtherLink(i, { url: e.target.value })}
                      style={{ flex: 1 }}
                    />
                    {otherLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeOtherLink(i)}
                        className="flex-none text-[13px] text-cp-muted"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  {o.url.trim() && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4, marginLeft: 104 }}>
                      <input
                        placeholder="채널 이름 (예: 밴드, 문자)"
                        value={o.label}
                        onChange={(e) => updateOtherLink(i, { label: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setOtherLinks((prev) => [...prev, { url: "", label: "", forInquiry: false, forBrowse: false }])
                }
                style={{ fontSize: 13 }}
              >
                + 기타 링크 추가
              </button>
            </div>
          </fieldset>

          <FileField
            label="대표 사진 (여러 장이면 히어로 배경에서 순서대로 넘어가요, 최대 5장)"
            multiple
            maxFiles={5}
            value={heroFiles}
            onChange={setHeroFiles}
          />
          <FileField label="로고" value={logoFiles} onChange={setLogoFiles} />
        </Section>
      )}

      {step === 1 && (
        <Section title="전문가 프로필 (필수)" meta="예상 소요시간 트레이너 1인당 약 30초~1분">
          <p style={{ fontSize: 13, color: "#666", margin: "-8px 0 0" }}>
            이 정보가 홈페이지의 핵심이에요. 손님들은 &quot;어떤 공간인가&quot;보다 &quot;누구에게 배우는가&quot;를 더 궁금해합니다.
          </p>
          {professionals.map((p, i) => (
            <fieldset key={i} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <legend style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                트레이너 {i + 1}
                {professionals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProfessional(i)}
                    className="text-[12px] font-normal text-cp-muted"
                  >
                    삭제
                  </button>
                )}
              </legend>
              <input placeholder="이름" value={p.name} onChange={(e) => updateProfessional(i, { name: e.target.value })} />
              <input
                placeholder="직함 (예: 대표 트레이너, 강사, 원장)"
                value={p.title}
                onChange={(e) => updateProfessional(i, { title: e.target.value })}
              />
              <FileField label="사진" value={p.photo} onChange={(files) => updateProfessional(i, { photo: files })} />
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
            </fieldset>
          ))}
          <button
            type="button"
            onClick={() =>
              setProfessionals((prev) => [
                ...prev,
                { name: "", title: "", photo: [], certificationsText: "", specialty: "", yearsExperience: "", bioQuote: "" },
              ])
            }
            style={{ fontSize: 13 }}
          >
            + 트레이너 추가
          </button>
        </Section>
      )}

      {step === 2 && (
        <Section title="프로그램·이용방법" meta="예상 소요시간 약 30초~1분">
          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>대표 프로그램</legend>
            {programs.map((p, i) => (
              <div key={i} className="mb-3 flex flex-col gap-1.5 border-b border-cp-border pb-3 last:border-b-0">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    placeholder="이름 (예: 1:1 PT 1회, 그룹 필라테스 8주 과정)"
                    value={p.name}
                    onChange={(e) => updateProgram(i, { name: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  {programs.length > 1 && (
                    <button type="button" onClick={() => removeProgram(i)} className="flex-none text-[13px] text-cp-muted">
                      삭제
                    </button>
                  )}
                </div>
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
        </Section>
      )}

      {step === GATE5_STEP && !gate5Opened && (
        <GateIntro
          description="솔직히 말씀드리면, 이 두 가지가 홈페이지 설득력의 8할을 좌우해요. 아무리 경력이 화려해도 '진짜 효과가 있었나'를 보여주는 것만큼 강력하지 않거든요. 시간이 되실 때 1개라도 채워주시면 결과물이 확실히 달라집니다. (사례 1개 기준 약 1~2분)"
          fillLabel="지금 채우기"
          skipLabel="나중에 할게요"
          onFill={() => setGate5Opened(true)}
          onSkip={skipGate}
        />
      )}

      {step === GATE5_STEP && gate5Opened && (
        <Section title="회원 변화 사례·후기">
          <Field
            label="손님께 가장 먼저 자신 있게 보여주고 싶은 게 있다면요? (선택)"
            hint="고르지 않으셔도 괜찮아요. 저희가 알아서 가장 설득력 있는 순서로 배치해드려요."
          >
            <select value={leadEmphasis} onChange={(e) => setLeadEmphasis(e.target.value as typeof leadEmphasis)}>
              <option value="">고르지 않음</option>
              <option value="transformations">회원 변화 사례</option>
              <option value="reviews">후기</option>
              <option value="professionals">트레이너 경력</option>
              <option value="facility">시설</option>
            </select>
          </Field>

          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>회원 변화 사례 (1~4개 권장)</legend>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 8px" }}>
              ⚠️ 회원님께 미리 동의를 받은 사진만 올려주세요 — 나중에 문제가 될 수 있어요.
            </p>
            {transformations.map((t, i) => (
              <div key={i} className="mb-3 flex flex-col gap-1.5 border-b border-cp-border pb-3 last:border-b-0">
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <FileField label="Before" value={t.beforeImage} onChange={(files) => updateTransformation(i, { beforeImage: files })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <FileField label="After" value={t.afterImage} onChange={(files) => updateTransformation(i, { afterImage: files })} />
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    placeholder="담당 트레이너 (선택, 여러 명이면 누가 지도했는지)"
                    value={t.trainerTag}
                    onChange={(e) => updateTransformation(i, { trainerTag: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  {transformations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTransformation(i)}
                      className="flex-none text-[13px] text-cp-muted"
                    >
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setTransformations((prev) => [
                  ...prev,
                  { beforeImage: [], afterImage: [], durationLabel: "", resultHighlight: "", memberLabel: "", trainerTag: "" },
                ])
              }
              style={{ fontSize: 13 }}
            >
              + 사례 추가
            </button>
          </fieldset>

          <fieldset style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
            <legend style={{ fontSize: 13, fontWeight: 700 }}>후기 (1~4개, 텍스트로 원문 그대로)</legend>
            {reviews.map((r, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
                <textarea
                  placeholder="후기 내용"
                  rows={2}
                  value={r.body}
                  onChange={(e) => updateReview(i, { body: e.target.value })}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="작성자 (예: 김O영)"
                    value={r.author}
                    onChange={(e) => updateReview(i, { author: e.target.value })}
                  />
                  <input
                    placeholder="별점 (선택, 1~5)"
                    value={r.rating}
                    onChange={(e) => updateReview(i, { rating: e.target.value })}
                    style={{ width: 90 }}
                  />
                </div>
                <input
                  placeholder="어디서 받은 후기인지 (예: 네이버 예약, 카카오맵, 인스타그램 DM)"
                  value={r.source}
                  onChange={(e) => updateReview(i, { source: e.target.value })}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    placeholder="담당 트레이너 (선택, 후기에 실제 언급된 경우만)"
                    value={r.trainerTag}
                    onChange={(e) => updateReview(i, { trainerTag: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  {reviews.length > 1 && (
                    <button type="button" onClick={() => removeReview(i)} className="flex-none text-[13px] text-cp-muted">
                      삭제
                    </button>
                  )}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setReviews((prev) => [...prev, { body: "", author: "", rating: "", source: "", trainerTag: "" }])
              }
              style={{ fontSize: 13 }}
            >
              + 후기 추가
            </button>
          </fieldset>
        </Section>
      )}

      {step === GATE6_STEP && !gate6Opened && (
        <GateIntro
          description="여기부터는 순전히 덤이에요. 안 채우셔도 홈페이지엔 전혀 문제없어요 — 다 채우면 약 3~4분, 마음에 드는 것만 답하셔도 충분해요."
          fillLabel="몇 개만 더 채우기"
          skipLabel="바로 완료하기"
          onFill={() => setGate6Opened(true)}
          onSkip={skipGate}
        />
      )}

      {step === GATE6_STEP && gate6Opened && (
        <Section title="더 채우면 좋아요">
          <div className="flex flex-col gap-3">
            <Accordion title="시설 정보" hint="가장 빠르게 끝나요">
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
              <Field label="평수">
                <input value={sizePyeong} onChange={(e) => setSizePyeong(e.target.value)} placeholder="숫자만 (예: 25)" style={{ width: 140 }} />
              </Field>
              <Field label="보유 기구 (쉼표로 구분)">
                <input
                  value={equipmentText}
                  onChange={(e) => setEquipmentText(e.target.value)}
                  placeholder="예: 리포머 5대, 캐딜락 2대"
                />
              </Field>
            </Accordion>

            <Accordion title="가까운 랜드마크">
              <Field
                label="가장 가까운 눈에 띄는 장소에서 도보 거리"
                hint="이 업종에서는 '가기 쉬운가'가 특히 중요하더라고요. 있으면 위치 안내에서 눈에 띄게 강조해드려요."
              >
                <input
                  value={landmarkDistance}
                  onChange={(e) => setLandmarkDistance(e.target.value)}
                  placeholder="예: 시청 사거리에서 도보 5분(지하철역이 아니어도 괜찮아요)"
                />
              </Field>
            </Accordion>

            <Accordion title="사업자정보">
              <Field label="사업자정보" hint="페이지 하단에 작게 표시돼요. 법적으로 필수는 아니지만, 있으면 신뢰도에 도움이 됩니다.">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <input placeholder="등록 상호명" value={registeredName} onChange={(e) => setRegisteredName(e.target.value)} />
                  <input placeholder="대표자명" value={ceoName} onChange={(e) => setCeoName(e.target.value)} />
                  <input
                    placeholder="사업자등록번호"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                  />
                </div>
              </Field>
            </Accordion>

            <Accordion title="시그니처 문구·슬로건">
              <Field
                label="이미 쓰고 계신 시그니처 문구나 슬로건이 있나요? (최대 40자)"
                hint="이미 손님들에게 익숙한 문구가 있으면, 저희가 새로 만들지 않고 그대로 헤드라인에 살려드려요."
              >
                <input
                  value={signaturePhrase}
                  onChange={(e) => setSignaturePhrase(e.target.value.slice(0, 40))}
                  maxLength={40}
                  placeholder="예: 8년째 한 사람만 보는 PT"
                />
              </Field>
            </Accordion>

            <Accordion title="공간 사진">
              <FileField
                label="트레이너·시설 사진과 겹치지 않는, 분위기를 보여주는 사진만"
                multiple
                value={facilityPhotos}
                onChange={setFacilityPhotos}
              />
            </Accordion>

            <Accordion title="FAQ 답변">
              <p className="text-[13px] text-cp-muted">
                &quot;초보자도 가능한가요?&quot; 같은 질문에 대한 답은 특히 강력해요 — 망설이는 손님을 상담으로 이끄는
                결정적인 한마디가 되거든요.
              </p>
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
                      placeholder="질문 (예: 환불 규정이 어떻게 되나요?)"
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
            </Accordion>

            {finalProfessionalsList.length > 0 && (
              <Accordion title="트레이너별 지도 철학">
                {professionals.map((p, i) =>
                  p.name.trim() ? (
                    <Field
                      key={i}
                      label={`[${p.name}]님의 지도 철학이나 스타일을 한 줄로 표현하면?`}
                      hint="이 한 줄이 있으면 '늘 최선을 다합니다' 같은 뻔한 소개 대신, 이 트레이너님만의 색깔이 드러나요."
                    >
                      <input
                        placeholder="처음 오시는 분일수록 더 꼼꼼히 봐드려요"
                        value={p.bioQuote}
                        onChange={(e) => updateProfessional(i, { bioQuote: e.target.value })}
                      />
                    </Field>
                  ) : null
                )}
              </Accordion>
            )}

            <Accordion title="공간에서 좋아하는 부분">
              <Field
                label="공간에서 손님들이 특히 좋아하는 부분이 있나요?"
                hint="이 답변이 있으면 사진만으로는 안 전해지는 이 공간만의 느낌이 문구로 살아나요."
              >
                <textarea
                  value={atmosphereText}
                  onChange={(e) => setAtmosphereText(e.target.value)}
                  rows={2}
                  placeholder="통유리라 낮 수업엔 자연광이 그대로 들어와요"
                />
              </Field>
            </Accordion>

            <Accordion title="스튜디오를 열게 된 계기" hint="가장 손이 많이 가는 항목이라 마지막에">
              <Field
                label="이 스튜디오를 열게 된 계기가 있나요?"
                hint="짧아도 좋아요. 이 답변은 눈에 띄는 문구로 따로 강조돼요(트레이너 개인 이야기 말고, 이 공간을 만들게 된 이유)."
              >
                <textarea
                  value={philosophyText}
                  onChange={(e) => setPhilosophyText(e.target.value)}
                  rows={2}
                  placeholder="기존 스튜디오들이 다 너무 좁고 시끄러워서, 직접 만들어보기로 했어요"
                />
              </Field>
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
        hidePrimary={(step === GATE5_STEP && !gate5Opened) || (step === GATE6_STEP && !gate6Opened)}
      />
    </main>
  );
}
