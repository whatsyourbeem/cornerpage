/**
 * boutique-fitness 프로스펙트 발굴 스크립트 (일회성 GTM 도구, 제품 코드 아님).
 *
 * 사용법:
 *   npx tsx scripts/prospect-discovery/discover.ts "매탄동 필라테스"
 *
 * 흐름: 네이버 지역검색(NAVER API HUB) → blog.naver.com 링크만 필터 →
 * 블로그 글이 5개 이상이면 "적합"으로 보고 모든 글을 크롤링 →
 * Claude로 boutique-fitness 입력폼(input-questions.md) 각 항목의 답을 채움 →
 * 결과를 scripts/prospect-discovery/output/에 마크다운으로 저장.
 *
 * 글이 5개 미만인 블로그는 "부적합"으로 보고 본문 크롤링을 건너뛴다(비용 절약).
 * 크롤링 원문 텍스트는 파일로 저장하지 않는다 — Claude 판단에 쓰고 버린다.
 */
import Anthropic from "@anthropic-ai/sdk";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const REPO_ROOT = join(import.meta.dirname, "..", "..");
const OUTPUT_DIR = join(import.meta.dirname, "output");

// ── env ──────────────────────────────────────────────────────────────────
// 프로젝트에 dotenv가 없어서(제품 코드는 Next.js가 알아서 로드) 이 스크립트 전용으로
// .env.local을 직접 읽는다. 이미 설정된 환경변수는 덮어쓰지 않는다.
function loadEnvLocal() {
  const path = join(REPO_ROOT, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
loadEnvLocal();

const NAVER_KEY_ID = process.env.NAVER_APIGW_API_KEY_ID;
const NAVER_KEY = process.env.NAVER_APIGW_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ── 공통 유틸 ─────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const CRAWL_DELAY_MS = 1500;
const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  const withoutScripts = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ");
  const text = withoutScripts.replace(/<[^>]+>/g, " ");
  return decodeHtmlEntities(text)
    .replace(/[ \t​]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

// ── 1. 네이버 지역검색 (NAVER API HUB) ───────────────────────────────────
interface NaverLocalItem {
  title: string;
  link: string;
  category: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

async function searchNaverLocal(query: string, sort: "random" | "comment", display = 5): Promise<NaverLocalItem[]> {
  if (!NAVER_KEY_ID || !NAVER_KEY) {
    throw new Error("NAVER_APIGW_API_KEY_ID / NAVER_APIGW_API_KEY가 .env.local에 없습니다.");
  }
  const url = new URL("https://naverapihub.apigw.ntruss.com/search/v1/local");
  url.searchParams.set("query", query);
  url.searchParams.set("display", String(Math.min(display, 5)));
  url.searchParams.set("sort", sort);

  const res = await fetch(url, {
    headers: {
      "X-NCP-APIGW-API-KEY-ID": NAVER_KEY_ID,
      "X-NCP-APIGW-API-KEY": NAVER_KEY,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`네이버 지역검색 API 실패 (${res.status}): ${body}`);
  }
  const json = (await res.json()) as { items: NaverLocalItem[] };
  return json.items.map((item) => ({
    ...item,
    title: decodeHtmlEntities(item.title.replace(/<\/?b>/g, "")),
  }));
}

/**
 * display=5 상한을 넘길 방법이 없어서(start 파라미터는 무시됨, 실측 확인) 대신
 * sort=random과 sort=comment를 각각 호출해 합친다 — 실측상 서로 다른(일부만 겹치는)
 * 5개씩을 주므로 최대 10개(중복 제외)까지 늘어난다.
 */
async function searchNaverLocalCombined(query: string): Promise<NaverLocalItem[]> {
  const [randomItems, commentItems] = await Promise.all([
    searchNaverLocal(query, "random"),
    searchNaverLocal(query, "comment"),
  ]);
  return [...randomItems, ...commentItems];
}

/** blog.naver.com/{blogId} 또는 blog.naver.com/{blogId}/{logNo} 둘 다 처리 */
function extractBlogId(link: string): string | null {
  try {
    const u = new URL(link);
    if (u.hostname !== "blog.naver.com") return null;
    const segment = u.pathname.split("/").filter(Boolean)[0];
    return segment || null;
  } catch {
    return null;
  }
}

// ── 2. 블로그 크롤링 ────────────────────────────────────────────────────
interface BlogPostMeta {
  logNo: string;
  title: string;
  addDate: string;
}

// "샅샅이" 기준으로 최근 글을 최대한 많이 가져오되, 무한정 읽지는 않는다 —
// 이 개수를 넘는 블로그는 최근 것부터 이 개수만큼만 대상으로 삼는다.
const POST_LIST_FETCH_COUNT = 60;
// 사용자 지시: 글이 이 개수 이상이면 판단 재료가 충분하다고 보고 "적합"으로 취급한다.
const MIN_POSTS_FOR_ELIGIBLE = 5;

async function fetchRecentPostList(blogId: string, count = POST_LIST_FETCH_COUNT): Promise<BlogPostMeta[]> {
  const url = `https://blog.naver.com/PostTitleListAsync.naver?blogId=${encodeURIComponent(
    blogId
  )}&viewdate=&currentPage=1&categoryNo=&parentCategoryNo=&countPerPage=${count}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`글 목록 조회 실패 (${res.status})`);
  // 응답의 pagingHtml 필드가 작은따옴표를 JS 스타일로 \'  이스케이프해서 내려오는데,
  // 이는 유효한 JSON escape가 아니라 그대로 JSON.parse하면 실패한다(실측 확인).
  const rawText = (await res.text()).replace(/\\'/g, "'");
  const json = JSON.parse(rawText) as {
    resultCode: string;
    postList: { logNo: string; title: string; addDate: string }[];
  };
  if (json.resultCode !== "S") throw new Error(`글 목록 조회 실패: resultCode=${json.resultCode}`);
  return json.postList.map((p) => ({
    logNo: p.logNo,
    title: decodeURIComponent(p.title.replace(/\+/g, " ")),
    addDate: p.addDate,
  }));
}

interface CrawledPost {
  title: string;
  addDate: string;
  text: string;
  imageCount: number;
}

/** se-main-container(스마트에디터 본문 wrapper)를 태그 균형 매칭으로 잘라낸다. */
function extractMainContainer(html: string): string | null {
  const startMarker = '<div class="se-main-container">';
  const start = html.indexOf(startMarker);
  if (start === -1) return null;
  const tagRe = /<div\b[^>]*>|<\/div>/g;
  tagRe.lastIndex = start;
  let depth = 0;
  let match: RegExpExecArray | null;
  while ((match = tagRe.exec(html))) {
    if (match[0].startsWith("</")) {
      depth--;
      if (depth === 0) return html.slice(start, tagRe.lastIndex);
    } else {
      depth++;
    }
  }
  return html.slice(start);
}

async function fetchPostText(blogId: string, logNo: string): Promise<{ text: string; imageCount: number } | null> {
  const url = `https://m.blog.naver.com/${encodeURIComponent(blogId)}/${encodeURIComponent(logNo)}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const html = await res.text();
  const container = extractMainContainer(html);
  if (!container) return null;
  const imageCount = (container.match(/<img\b/gi) || []).length;
  return { text: stripTags(container), imageCount };
}

/** 적합 판정된 블로그의 글을 전부(postList에 담긴 만큼) 읽는다 — 조기 종료 없음. */
async function crawlAllPosts(blogId: string, postList: BlogPostMeta[]): Promise<CrawledPost[]> {
  const posts: CrawledPost[] = [];
  for (const meta of postList) {
    await sleep(CRAWL_DELAY_MS);
    const fetched = await fetchPostText(blogId, meta.logNo);
    if (!fetched) continue;
    posts.push({ title: meta.title, addDate: meta.addDate, text: fetched.text, imageCount: fetched.imageCount });
  }
  return posts;
}

// ── 3. Claude로 input-questions.md 항목 채우기 ──────────────────────────
const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

interface DraftAnswers {
  // STEP 2 — 기본 정보
  phone: string | null;
  consultation_hours: string | null;
  contact_links: { platform: string; url_or_note: string }[];
  space_photos: { present: boolean; note: string };
  logo: { present: boolean; note: string };

  // STEP 3 — 프로그램·이용방법
  programs: { name: string; price_note: string | null }[];
  trial: { available: boolean | null; note: string };

  // STEP 4 — 전문가 프로필 (필수, 트레이너별 반복)
  trainers: {
    name: string;
    title: string | null;
    specialty: string | null;
    years_experience: string | null;
    certifications: string[];
    photo_note: string;
  }[];

  // STEP 5 — 회원 변화 사례·후기 (독립 게이트)
  transformations: { summary: string; duration: string | null; key_change: string | null; trainer: string | null }[];
  reviews: { content: string; source: string | null }[];

  // STEP 6 — 더 채우면 좋은 것들 (선택)
  facility: { shower: boolean | null; locker: boolean | null; parking: boolean | null; size: string | null; equipment: string | null };
  directions: string | null;
  faq: { question: string; answer: string }[];
  slogan: string | null;
  space_strengths: string | null;
  trainer_philosophies: { trainer: string; philosophy: string }[];
  founding_story: string | null;
  business_registration: string | null;

  // 메타
  data_gaps: string[]; // 못 채운 필수/준필수 항목 목록 (사람이 직접 물어봐야 할 것)
  notable: string; // 아웃리치에 쓸 만한 특징
  caveats: string; // 주의점
}

const EXTRACTION_SYSTEM_PROMPT = `너는 코너페이지(소상공인 미니 홈페이지 자동생성 서비스)의 영업 리서처다.
아래는 boutique-fitness(PT·필라테스·요가 스튜디오) vertical 입력 폼(input-questions.md)이 요구하는 항목이다.
크롤링한 네이버 블로그 글 전체를 읽고, 이 입력 폼을 대신 채운다는 생각으로 각 항목의 실제 답을 최대한
찾아서 JSON으로만 답하라. 여러 글에 걸쳐 흩어진 정보를 종합해도 된다. 없는 정보는 지어내지 말고
null/빈 배열로 두고 data_gaps에 기록하라.

## STEP 2 — 기본 정보
- 전화번호
- 상담·수업 가능 시간대 (예약제면 예약 가능 시간대)
- 연락 링크: 카카오톡채널/인스타그램/유튜브/네이버지도/기타 링크가 본문에 언급되면 기록 (블로그 링크 자체는 이미 확보돼 있으니 제외)
- 공간 사진: 스튜디오 내부·외부를 보여주는 사진이 실제로 첨부됐는지 (이미지 개수·문맥으로 판단)
- 로고: 로고 이미지 존재 언급 여부 (보통 텍스트로는 알기 어려우니 note에 판단 근거만)

## STEP 3 — 프로그램·이용방법
- 대표 프로그램 (이름, 가격은 "상담 후 안내"가 기본이라 없어도 됨)
- 무료체험·1회체험 프로그램 유무

## STEP 4 — 전문가 프로필 (이 vertical의 핵심, 트레이너별로 반복)
- 이름, 직함(대표 트레이너/강사/원장 등), 전문 분야, 지도 경력(년수), 보유 자격증
- 사진: 트레이너 개인 사진이 있는지는 photo_note에 근거만 텍스트로

## STEP 5 — 회원 변화 사례·후기 (있는 만큼 전부)
- 변화 사례: 비포·애프터 요약, 기간, 핵심 변화(수치 등), 담당 트레이너
- 후기: 실제 후기 텍스트, 출처(네이버예약/카카오맵/인스타 DM 등 언급되면)

## STEP 6 — 더 채우면 좋은 것들 (선택, 있는 만큼)
- 시설정보(샤워실/개인라커/주차 유무, 평수, 보유기구)
- 찾아오는 길(가까운 랜드마크에서 도보 거리)
- FAQ 재료(환불규정/준비물/초보자 안내 등)
- 슬로건(짧은 시그니처 문구)
- 공간 장점(조용함/채광/음악/청결도 등 자유서술)
- 트레이너별 지도 철학(한 줄)
- 창업 계기 스토리
- 사업자정보(상호명/대표자명/사업자등록번호 — 블로그에 거의 없음, 있으면만)

## 출력 형식 (JSON만, 다른 텍스트 금지)
{
  "phone": string|null,
  "consultation_hours": string|null,
  "contact_links": [{"platform": string, "url_or_note": string}],
  "space_photos": {"present": bool, "note": string},
  "logo": {"present": bool, "note": string},
  "programs": [{"name": string, "price_note": string|null}],
  "trial": {"available": bool|null, "note": string},
  "trainers": [{"name": string, "title": string|null, "specialty": string|null, "years_experience": string|null, "certifications": [string], "photo_note": string}],
  "transformations": [{"summary": string, "duration": string|null, "key_change": string|null, "trainer": string|null}],
  "reviews": [{"content": string, "source": string|null}],
  "facility": {"shower": bool|null, "locker": bool|null, "parking": bool|null, "size": string|null, "equipment": string|null},
  "directions": string|null,
  "faq": [{"question": string, "answer": string}],
  "slogan": string|null,
  "space_strengths": string|null,
  "trainer_philosophies": [{"trainer": string, "philosophy": string}],
  "founding_story": string|null,
  "business_registration": string|null,
  "data_gaps": [string],
  "notable": string,
  "caveats": string
}`;

const MAX_JSON_REPAIR_ATTEMPTS = 2;

/** src/lib/generate-content.ts의 repair loop과 같은 패턴: 파싱 실패 시 오류를 알려주고 재요청. */
async function extractDraftAnswers(businessName: string, posts: CrawledPost[]): Promise<DraftAnswers> {
  const corpus = posts
    .map((p) => `### ${p.title} (${p.addDate}, 첨부 이미지 ${p.imageCount}장)\n${p.text}`)
    .join("\n\n---\n\n");

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `업체명: ${businessName}\n\n전체 글 ${posts.length}개:\n\n${corpus}` },
  ];

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_JSON_REPAIR_ATTEMPTS; attempt++) {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8192,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages,
    });
    const block = response.content.find((b) => b.type === "text");
    if (!block || block.type !== "text") throw new Error("Claude 응답에 텍스트 블록이 없음");
    const fenced = block.text.match(/```(?:json)?\s*([\s\S]*?)(?:```|$)/);
    const jsonText = fenced ? fenced[1] : block.text;

    try {
      return JSON.parse(jsonText) as DraftAnswers;
    } catch (err) {
      lastError = err;
      if (attempt === MAX_JSON_REPAIR_ATTEMPTS) break;
      const errorMessage = err instanceof Error ? err.message : String(err);
      messages.push({ role: "assistant", content: block.text });
      messages.push({
        role: "user",
        content: `아래 JSON 파싱 오류를 수정해서 유효한 JSON만 다시 응답해 (설명 텍스트, 코드펜스 없이):\n${errorMessage}`,
      });
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

// ── 4. 결과 조립 + 리포트 ────────────────────────────────────────────────
interface EligibleResult {
  name: string;
  address: string;
  roadAddress: string;
  blogUrl: string;
  answers: DraftAnswers;
  postsRead: number;
  postListSize: number;
}

interface IneligibleResult {
  name: string;
  address: string;
  roadAddress: string;
  blogUrl: string;
  postListSize: number;
}

interface FailedResult {
  name: string;
  blogUrl: string;
  reason: string;
}

function formatFullReport(r: EligibleResult): string {
  const a = r.answers;
  const lines: string[] = [];
  lines.push(`## ${r.name}`, "");
  lines.push(`- **주소**: ${r.roadAddress || r.address}`);
  lines.push(`- **블로그**: ${r.blogUrl}`);
  lines.push(`- **읽은 글**: ${r.postsRead}/${r.postListSize}`);
  lines.push("");

  lines.push("### STEP 2 — 기본 정보");
  lines.push(`- 전화번호: ${a.phone ?? "❌ 정보없음"}`);
  lines.push(`- 상담·수업 가능 시간대: ${a.consultation_hours ?? "❌ 정보없음"}`);
  lines.push(
    `- 연락 링크: ${a.contact_links.length ? a.contact_links.map((c) => `${c.platform}(${c.url_or_note})`).join(", ") : "❌ 정보없음"}`
  );
  lines.push(`- 공간 사진: ${a.space_photos.present ? "✅" : "❌"} ${a.space_photos.note}`);
  lines.push(`- 로고: ${a.logo.present ? "✅" : "❌"} ${a.logo.note}`);
  lines.push("");

  lines.push("### STEP 3 — 프로그램·이용방법");
  lines.push(
    `- 대표 프로그램: ${a.programs.length ? a.programs.map((p) => `${p.name}${p.price_note ? `(${p.price_note})` : ""}`).join(", ") : "❌ 정보없음"}`
  );
  lines.push(`- 체험 프로그램: ${a.trial.available === null ? "❓ 불명확" : a.trial.available ? "✅" : "❌"} ${a.trial.note}`);
  lines.push("");

  lines.push("### STEP 4 — 전문가 프로필");
  if (a.trainers.length === 0) {
    lines.push("❌ 정보없음 (강사 소개 글 미확인)");
  } else {
    for (const t of a.trainers) {
      lines.push(
        `- **${t.name || "이름 미상"}**${t.title ? ` (${t.title})` : ""} — 전문분야: ${t.specialty ?? "-"}, 경력: ${
          t.years_experience ?? "-"
        }, 자격증: ${t.certifications.length ? t.certifications.join(", ") : "-"} — 사진: ${t.photo_note}`
      );
    }
  }
  lines.push("");

  lines.push("### STEP 5 — 회원 변화 사례·후기");
  lines.push(`**변화 사례 (${a.transformations.length}건)**`);
  if (a.transformations.length === 0) {
    lines.push("- ❌ 없음");
  } else {
    for (const t of a.transformations) {
      lines.push(`- ${t.summary} (기간: ${t.duration ?? "-"}, 핵심변화: ${t.key_change ?? "-"}, 담당: ${t.trainer ?? "-"})`);
    }
  }
  lines.push(`**후기 (${a.reviews.length}건)**`);
  if (a.reviews.length === 0) {
    lines.push("- ❌ 없음");
  } else {
    for (const rv of a.reviews) lines.push(`- "${rv.content}"${rv.source ? ` (${rv.source})` : ""}`);
  }
  lines.push("");

  const facilityBits: string[] = [];
  if (a.facility.shower !== null) facilityBits.push(`샤워실 ${a.facility.shower ? "O" : "X"}`);
  if (a.facility.locker !== null) facilityBits.push(`라커 ${a.facility.locker ? "O" : "X"}`);
  if (a.facility.parking !== null) facilityBits.push(`주차 ${a.facility.parking ? "O" : "X"}`);
  if (a.facility.size) facilityBits.push(`평수: ${a.facility.size}`);
  if (a.facility.equipment) facilityBits.push(`보유기구: ${a.facility.equipment}`);

  lines.push("### STEP 6 — 부가 정보");
  lines.push(`- 시설정보: ${facilityBits.length ? facilityBits.join(", ") : "-"}`);
  lines.push(`- 찾아오는 길: ${a.directions ?? "-"}`);
  lines.push(`- FAQ: ${a.faq.length ? a.faq.map((f) => `[${f.question}] ${f.answer}`).join(" / ") : "-"}`);
  lines.push(`- 슬로건: ${a.slogan ?? "-"}`);
  lines.push(`- 공간 장점: ${a.space_strengths ?? "-"}`);
  lines.push(
    `- 트레이너별 지도철학: ${a.trainer_philosophies.length ? a.trainer_philosophies.map((p) => `[${p.trainer}] ${p.philosophy}`).join(" / ") : "-"}`
  );
  lines.push(`- 창업 계기: ${a.founding_story ?? "-"}`);
  lines.push(`- 사업자정보: ${a.business_registration ?? "-"}`);
  lines.push("");

  lines.push(`**못 채운 항목**: ${a.data_gaps.length ? a.data_gaps.join(", ") : "없음"}`);
  lines.push(`**눈에 띄는 특징**: ${a.notable || "-"}`);
  lines.push(`**주의점**: ${a.caveats || "-"}`);
  lines.push("");

  return lines.join("\n");
}

function buildReport(
  query: string,
  eligible: EligibleResult[],
  ineligible: IneligibleResult[],
  filteredOutNonBlog: NaverLocalItem[],
  failed: FailedResult[]
): string {
  const lines: string[] = [];
  lines.push(`# 프로스펙트 발굴 결과 — "${query}"`);
  lines.push("");
  lines.push(`생성 시각: ${new Date().toISOString()}`);
  lines.push("");
  lines.push(
    `기준: 블로그 글 ${MIN_POSTS_FOR_ELIGIBLE}개 이상 → 적합. ` +
      `네이버 지역검색 결과 중 블로그 링크 ${eligible.length + ineligible.length + failed.length}건 처리 ` +
      `(인스타·유튜브 등 비블로그 ${filteredOutNonBlog.length}건 제외) — ` +
      `적합 ${eligible.length} / 부적합 ${ineligible.length} / 처리실패 ${failed.length}`
  );
  lines.push("");

  if (eligible.length > 0) {
    lines.push("# 적합 — 입력 폼 초안", "");
    for (const r of eligible) lines.push(formatFullReport(r));
  }
  if (ineligible.length > 0) {
    lines.push("# 부적합 (글 5개 미만)", "");
    for (const r of ineligible) {
      lines.push(`- ${r.name} (${r.roadAddress || r.address}) — ${r.blogUrl} — 글 ${r.postListSize}개`);
    }
    lines.push("");
  }
  if (failed.length > 0) {
    lines.push("# 처리 실패 (크롤링/API 오류)", "");
    for (const f of failed) lines.push(`- ${f.name} — ${f.blogUrl} — ${f.reason}`);
    lines.push("");
  }
  if (filteredOutNonBlog.length > 0) {
    lines.push("# 제외됨 (블로그 링크 아님 — 인스타 등)", "");
    for (const item of filteredOutNonBlog) lines.push(`- ${item.title} — ${item.link}`);
    lines.push("");
  }

  return lines.join("\n");
}

// ── 5. dedup ─────────────────────────────────────────────────────────────
function dedupByNameAndCoords(items: NaverLocalItem[]): NaverLocalItem[] {
  const seen = new Set<string>();
  const result: NaverLocalItem[] = [];
  for (const item of items) {
    const key = `${item.title}|${item.mapx}|${item.mapy}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

// ── main ─────────────────────────────────────────────────────────────────
async function main() {
  const query = process.argv[2];
  if (!query) {
    console.error('사용법: npx tsx scripts/prospect-discovery/discover.ts "매탄동 필라테스"');
    process.exit(1);
  }
  if (!ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY가 .env.local에 없습니다.");
    process.exit(1);
  }

  console.log(`[1/4] 네이버 지역검색: "${query}" (sort=random + sort=comment)`);
  const items = dedupByNameAndCoords(await searchNaverLocalCombined(query));
  console.log(`  → ${items.length}개 업체 (dedup 후)`);

  const blogItems = items.filter((i) => extractBlogId(i.link) !== null);
  const nonBlogItems = items.filter((i) => extractBlogId(i.link) === null);
  console.log(`[2/4] 블로그 링크 필터: ${blogItems.length}개 대상 (제외 ${nonBlogItems.length}개)`);

  const eligible: EligibleResult[] = [];
  const ineligible: IneligibleResult[] = [];
  const failed: FailedResult[] = [];

  for (const item of blogItems) {
    const blogId = extractBlogId(item.link)!;
    console.log(`[3/4] 확인 중: ${item.title} (${item.link})`);
    try {
      const postList = await fetchRecentPostList(blogId);
      if (postList.length < MIN_POSTS_FOR_ELIGIBLE) {
        console.log(`  → 글 ${postList.length}개, 기준(${MIN_POSTS_FOR_ELIGIBLE}개) 미달 — 부적합`);
        ineligible.push({
          name: item.title,
          address: item.address,
          roadAddress: item.roadAddress,
          blogUrl: item.link,
          postListSize: postList.length,
        });
        continue;
      }

      console.log(`  → 글 ${postList.length}개, 적합 — 전체 크롤링 시작`);
      const posts = await crawlAllPosts(blogId, postList);
      if (posts.length === 0) {
        failed.push({ name: item.title, blogUrl: item.link, reason: "본문 추출 가능한 글 없음" });
        continue;
      }
      console.log(`  → ${posts.length}/${postList.length}개 글 읽음, Claude로 입력폼 항목 채우는 중...`);
      const answers = await extractDraftAnswers(item.title, posts);
      eligible.push({
        name: item.title,
        address: item.address,
        roadAddress: item.roadAddress,
        blogUrl: item.link,
        answers,
        postsRead: posts.length,
        postListSize: postList.length,
      });
      console.log(`  → 완료`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error(`  ⚠ 실패: ${reason}`);
      failed.push({ name: item.title, blogUrl: item.link, reason });
    }
  }

  console.log(`[4/4] 리포트 생성`);
  const report = buildReport(query, eligible, ineligible, nonBlogItems, failed);

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const slug = query.replace(/\s+/g, "-");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(OUTPUT_DIR, `${slug}-${timestamp}.md`);
  writeFileSync(outPath, report, "utf-8");

  console.log("\n" + report);
  console.log(`\n저장됨: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
