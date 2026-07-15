# cornerpage (코너페이지)

소상공인이 업체 정보만 입력하면 자기만의 미니 홈페이지가 자동으로 만들어지는 서비스. 완성된 홈페이지는 `{slug}.cornerpage.co` 형태의 고유 서브도메인으로 즉시 서비스된다.

## 1. 전체 흐름

```
[1] cornerpage.co 접속 → 업체 정보 입력 (텍스트 + 대표사진/메뉴사진/로고 이미지)
       ↓
[2] 프론트엔드 → 백엔드 API 호출
       ↓
[3] 백엔드 → LLM 스킬(mini-homepage-builder) 호출 → 콘텐츠 JSON 생성
       ↓          (이미지 URL은 스킬이 판단하지 않고, 이미 업로드되어 확정된 값을 그대로 통과)
[4] 콘텐츠 JSON을 DB(Supabase)에 저장
       ↓
[5] 유저에게 "{slug}.cornerpage.co에서 확인하세요" 안내
       ↓
[6] 방문자가 {slug}.cornerpage.co 접속
       ↓ 와일드카드 DNS로 동일 배포가 받음
       ↓ proxy.ts가 host 헤더의 서브도메인을 파싱해 /site/[slug]로 rewrite
       ↓ DB에서 slug로 콘텐츠 JSON 조회
       ↓ 렌더러(MiniHomepageSite)가 그 JSON을 받아 LLM 호출 없이 결정적으로 화면을 그림
```

이 프로젝트는 **6번부터 거꾸로** 구현해왔다. "콘텐츠 JSON이 이미 있다고 가정했을 때 그걸 어떻게 예쁘게, 어떤 URL로 보여줄 것인가"를 먼저 완성하고, 그 다음 "콘텐츠 JSON을 어떻게 만들어서 저장할 것인가"로 거슬러 올라가는 순서다. 지금은 1→6번 전 구간이 실제로 동작한다 — 남은 일은 유저 인증/소유권, 슬러그 커스터마이징 같은 파이프라인 바깥의 기능들이다(12절 참고).

## 2. 구현 상태

| 단계 | 상태 | 비고 |
|---|---|---|
| 1. 입력 폼 | 🟢 완료 | `/create` — 업종·기본정보·강점/소개·서비스/사진·신뢰/링크·이용방법/FAQ 6단계 질문형 UI |
| 2. 백엔드 API | 🟢 완료 | `/api/sites/draft`, `/api/upload`, `/api/sites`. ajv로 콘텐츠 JSON 런타임 스키마 검증 |
| 3. LLM 콘텐츠 생성 | 🟢 완료 | `src/lib/generate-content.ts` — `mini-homepage-builder` 스킬 결합 프롬프트로 실제 Claude API 호출 |
| 4. DB 저장 | 🟢 완료 | Supabase `sites` 테이블, RLS, GitHub 연동 마이그레이션 |
| 5. URL 안내 | 🟢 완료 | `/create` 제출 후 결과 화면에 표시 |
| 6. 렌더링 + 배포 | 🟢 완료 | 서브도메인 라우팅, 디자인 템플릿 10블록, Vercel 배포, 커스텀 도메인 |

## 3. 기술 스택

- **Next.js 16** (App Router, Turbopack) — ⚠️ 이 버전은 학습 데이터 기준과 다른 breaking change가 있다. 예: `middleware.ts`가 `proxy.ts`로 이름이 바뀌고 `export function proxy`를 씀. 새 API를 쓰기 전엔 `node_modules/next/dist/docs/`를 먼저 확인할 것 (`AGENTS.md` 참고).
- **TypeScript**
- **Tailwind CSS v4** — 레이아웃 보조용으로만 소량 사용. 디자인은 대부분 CSS Modules + CSS 커스텀 프로퍼티(토큰) 기반
- **Anthropic SDK** (`@anthropic-ai/sdk`) — 콘텐츠 생성용 Claude API 호출(`claude-sonnet-5`)
- **ajv**(`ajv/dist/2020`) — LLM 출력 콘텐츠 JSON의 런타임 스키마 검증(9절 참고)
- **Supabase** — Postgres DB, Storage, GitHub 연동 자동 마이그레이션 배포
- **Vercel** — 배포, 커스텀 도메인(`cornerpage.co` + 와일드카드)
- **Pretendard**(자체 호스팅 가변 폰트, 본문 공통) + 톤별 헤드라인 서체(Gmarket Sans / Pretendard Black / S-Core Dream, jsdelivr `fonts-archive` CDN으로 로드 — 이유는 8절 참고)

## 4. 콘텐츠 스키마 & 생성 파이프라인

렌더러의 입력 계약은 `src/lib/content-types.ts`의 `MiniHomepageContent`(실제로는 `spec/schema/content.types.ts`를 재export). 원본 스키마 문서는 `spec/schema/content.schema.json`(JSON Schema, ajv 검증에 실제로 쓰이는 파일)과 `spec/design/design-guide.md`(디자인 규칙)에 있다.

```ts
interface MiniHomepageContent {
  meta: {
    business_name, industry_category,
    axis_a_tone: "감성형" | "신뢰형" | "혼합형",       // 디자인 톤
    axis_b_layout: "갤러리우선" | "메뉴우선" | "해당없음", // 블록 순서
    cta_primary_action: "call" | "reservation" | "direction",
    cta_interaction_mode, logo_url,
    brand_color: string | null,   // 사장님 지정 브랜드 컬러(hex). null이면 톤 기본 팔레트
  };
  blocks: {
    topbar, hero, trust_strip,           // 필수
    about, philosophy, atmosphere,       // nullable (블록째로 꺼짐) — 서로 독립된 top-level 블록
    gallery, reviews,                    // nullable (블록째로 꺼짐)
    menu,                                // item_price | item_consult | package_table 3분기
    info, sticky_cta,                    // 필수
    how_it_works, faq,                   // nullable
  };
}
```

핵심 원칙: **LLM(스킬)은 카피·블록 온오프·톤 판단만 하고, 이미지 URL이나 brand_color처럼 이미 확정된 값은 그대로 통과시키기만 한다.** 렌더러는 이 JSON을 받아 LLM 호출 없이 결정적으로 화면을 그린다.

**생성 파이프라인** (`src/lib/generate-content.ts`):

1. `/create` 6단계 폼이 가공되지 않은 원본 사업 정보(`DraftAnswers` — 업종·기본정보·강점/소개·메뉴/서비스·신뢰/링크·이용방법/FAQ)를 모아 `/api/sites`에 제출한다. 톤·레이아웃·카피 판단은 프론트가 미리 정하지 않고 전부 스킬이 한다.
2. 빌드/개발 시작 시(`predev`/`prebuild` npm 스크립트) `scripts/build-skill-prompt.ts`가 `spec/skill/SKILL.md` + `spec/skill/references/*.md`를 하나의 시스템 프롬프트로 결합해 `src/lib/skill-prompt.generated.ts`를 생성한다(자동 생성 파일, 직접 수정 금지).
3. `generateContent()`가 주소를 OpenStreetMap Nominatim으로 지오코딩(`src/lib/geocode.ts`, 무료·키 불필요)한 뒤, 결합된 스킬 프롬프트를 system으로 Claude(`claude-sonnet-5`)를 호출해 콘텐츠 JSON을 얻는다.
4. Structured Outputs(`output_config.format`)는 쓰지 않는다 — 이 스키마(11개 블록, 다수 `$defs`, `if/then` 조건부, 배열 제약)가 Claude Structured Outputs가 지원하는 JSON Schema 범위를 넘어 여러 종류의 400 에러를 냈다(실측: minItems/maxItems 제약, if/then 분기, 최종적으로 "compiled grammar is too large"). 대신 프롬프트로 구조를 지시하고 **ajv로 전체 스키마를 사후 검증**하는 이중 안전망 방식을 쓴다.
5. `map_coordinates`, hours의 `break`/`last_order` 같은 nullable 필수 필드는 Claude가 종종 키 자체를 누락시켜서(값이 없으면 `null`을 명시해야 하는데 생략하는 경우) 백엔드가 결정적으로 보정한 뒤 검증한다. `philosophy`/`atmosphere`는 `about`과 독립된 top-level 블록(선택)이라 아예 키 자체가 없어도 스키마상 유효한데, TS 타입은 항상 `Philosophy | null`을 기대하므로 키가 없으면 `null`로 채워 형태를 통일한다.
6. ajv(`ajv/dist/2020` — plain `Ajv`는 이 스키마의 `2020-12` `$schema` 선언과 안 맞아 에러남) 검증에 실패하거나 네트워크/레이트리밋 오류가 나면 1회 재시도 후 포기한다(데이터를 지어내지 않음).

## 5. 프로젝트 구조

```
src/
  app/
    page.tsx                    루트(cornerpage.co) 랜딩 페이지
    create/page.tsx              6단계 질문형 입력 폼 (업종/기본정보/강점·소개/서비스·사진/신뢰·링크/이용방법·FAQ)
    site/[slug]/page.tsx         실서비스 렌더링 경로 (proxy.ts가 여기로 rewrite)
    preview/page.tsx             개발용 — DB의 전체 사이트 목록
    preview/[slug]/page.tsx      개발용 — 톤/레이아웃/브랜드컬러 스위처 얹은 프리뷰
    api/
      sites/draft/route.ts       site id(uuid) 발급
      upload/route.ts            이미지 업로드 → Supabase Storage
      sites/route.ts             폼 답변(DraftAnswers) → 실제 콘텐츠 생성 → DB insert
  components/site/
    MiniHomepageSite.tsx         최상위 렌더러 — 레이아웃 조립 + 브랜드컬러 오버라이드
    blocks/                      10개 블록 컴포넌트 (Topbar/Hero/TrustStrip/About/Menu/
                                  Gallery/Reviews/Info/StickyCta/HowItWorks/Faq)
    shared/                      CtaButton, SmartImage(이미지 실패 폴백)
  lib/
    content-types.ts             spec/schema/content.types.ts를 재export하는 래퍼 (렌더러 import 경로 유지용)
    tone.ts                      톤/레이아웃 매핑 + brand_color 오버라이드 로직
    color.ts                     브랜드 컬러 → 팔레트 유도 (WCAG 대비 보정)
    cta.ts                       CTA 목적지 href 계산
    hours.ts                     영업시간 포맷팅
    supabase.ts                  공개 읽기 전용 클라이언트 (publishable key)
    supabase-admin.ts            서버 전용 쓰기 클라이언트 (secret key, RLS 우회)
    sites.ts                     getSiteBySlug / listSites
    generate-content.ts          실제 콘텐츠 생성기 — 스킬 프롬프트 결합 Claude 호출 + ajv 검증(4절)
    geocode.ts                   주소 → 위경도 (Nominatim, 키 불필요)
    skill-prompt.generated.ts    자동 생성됨 — scripts/build-skill-prompt.ts 산출물, 직접 수정 금지
  proxy.ts                       서브도메인 → /site/[slug] rewrite (구 middleware.ts)
scripts/
  build-skill-prompt.ts          spec/skill/ 문서를 결합해 skill-prompt.generated.ts 생성 (predev/prebuild 훅)
supabase/
  migrations/                    스키마 변경 이력 (GitHub 연동이 main push 시 자동 적용)
spec/                            개발 참고 자료 통합 패키지 — 문서가 아니라 빌드 의존성(spec/README.md 참고)
  schema/
    content.schema.json          콘텐츠 JSON의 실제 원본 스키마 (ajv가 이 파일을 컴파일)
    content.types.ts             TypeScript 타입 원본 (content-types.ts가 재export)
  skill/
    SKILL.md                     mini-homepage-builder 스킬 본문(톤/레이아웃/카피 판단 지침)
    references/
      prompt-schema-summary.md   content.schema.json의 프롬프트용 축약본
      blocks.md / copywriting.md                      블록별 판단 지침 (업종 무관, 공통)
      general/ · verticals/{업종}/                     업종별 input-questions.md · industry-data.md
    evals/                       스킬 평가 테스트 케이스
  design/
    design-guide.md              디자인 톤/레이아웃/반응형/null폴백 규칙 원본
    fixtures/                    검증된 콘텐츠 JSON 샘플 (렌더링 테스트용)
```

## 6. 라우팅 구조

`src/proxy.ts`(Next 16의 middleware)가 host 헤더를 보고 분기한다:

- **루트 도메인** (`cornerpage.co`, `www`, 로컬 `localhost:3000`) → 그대로 통과, `/`(입력 폼)·`/preview/*`·`/api/*` 등 일반 라우트 서빙
- **서브도메인** (`{slug}.cornerpage.co`, 로컬 `{slug}.localhost:3000`) → `/site/{slug}`로 내부 rewrite (주소창 URL은 그대로 유지됨, `NextResponse.rewrite`라 유저에게 안 보임)

로컬 개발 시 `*.localhost`는 브라우저가 127.0.0.1로 자동 해석해줘서(RFC 6761) `/etc/hosts` 수정 없이 `http://cafe-millmuldabang.localhost:3000` 같은 식으로 바로 테스트 가능.

`/site/[slug]`와 `/preview/[slug]`는 데이터 소스(`getSiteBySlug`)가 완전히 동일하다. `/preview`는 그 위에 톤/레이아웃/브랜드컬러를 쿼리 파라미터로 오버라이드하는 개발용 스위처(`ToneSwitcher.tsx`)만 얹혀있는 구조라, 실서비스 렌더링과 100% 같은 컴포넌트를 쓰면서 디자인 디테일만 자유롭게 확인할 수 있다.

## 7. 데이터베이스 (Supabase)

**프로젝트**: `cornerpage` (region: ap-northeast-1) — Vercel과 연동되어 있어 `NEXT_PUBLIC_SUPABASE_URL` 등 환경변수가 자동 동기화된다.

**GitHub 연동**: `main` 브랜치를 보고 있다가, `supabase/migrations/*.sql`이 포함된 push가 들어오면 자동으로 원격 DB에 적용한다. `develop`에 push해도 반영 안 되니, 스키마 변경은 최종적으로 `main`에 머지되어야 실제로 적용됨. (첫 push 때 웹훅을 못 탄 적이 있었는데, 빈 커밋으로 재push하니 해결됨 — 안 먹히면 이 방법부터 시도.)

**`sites` 테이블**:

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid, PK | `gen_random_uuid()` 디폴트. 내부 안정 식별자 |
| `slug` | text, unique | 라우팅에 실제로 쓰이는 값. INSERT 시 비워두면 트리거가 `id`를 복사해 기본값으로 채움. 유저가 나중에 원하는 문자열로 변경 가능(DNS 라벨 형식 제약: 소문자/숫자/하이픈, 63자 이하) |
| `business_name` | text | |
| `content_json` | jsonb | `MiniHomepageContent` 그대로 |
| `created_at` / `updated_at` | timestamptz | `updated_at`은 트리거로 자동 갱신 |

**RLS**: 활성화됨. `select`만 `anon`/`authenticated`에 공개 — 미니홈페이지는 누구나 봐야 하는 공개 페이지라서. `insert`/`update`/`delete`는 정책이 아예 없어서 익명 요청은 전부 막히고, 백엔드(API 라우트)만 `service_role`(secret key)로 우회해서 쓴다.

**Storage**: `site-images` 버킷(public). 업로드 정책도 없음 — 브라우저가 anon 키로 직접 못 올리고, 항상 `/api/upload`(secret key 보유)를 거치게 강제한다. 경로는 `{site_id}/{slot}.{ext}` 형태로, `/api/sites/draft`가 미리 발급한 uuid를 site_id로 재사용해서 업로드 경로와 최종 DB row id가 같은 값이 되도록 한다.

**현재 데이터**: 핸드오프 fixture 6종 + 전체 블록 쇼케이스 1개, 총 7개 샘플 사이트가 실제 row로 들어있다(`cafe-millmuldabang`, `dental-suji`, `funeral-sambo`, `gym-thorgym`, `nail-ofyoon`, `studycafe-ivy`, `showcase-all-blocks`).

## 8. 디자인 시스템

`design-guide.md`가 원본이며, 핵심만 요약:

- **톤 3종(축 A)**: 감성형(따뜻함·Gmarket Sans 헤드라인·웨이브 디바이더)·신뢰형(절제·Pretendard Black 헤드라인·미니멀 모션)·혼합형(임팩트·S-Core Dream 헤드라인·카운트업 애니메이션). 색상·모션·시그니처 요소가 톤마다 다름
- **레이아웃 2종(축 B)**: 갤러리우선/메뉴우선이 블록 순서를 결정, 해당없음이면 갤러리 블록 자체가 트리에서 빠짐
- **brand_color 오버라이드**: 사장님이 브랜드 컬러를 지정하면 그 hex를 씨앗 삼아 `--brand`/`--brand-deep`/`--accent`/`--accent-on-dark`/`--button-text`를 결정적으로 유도(`src/lib/color.ts`). `--accent`는 밝은 배경(paper) 기준, `--accent-on-dark`는 어두운 배경(brand-deep) 기준으로 각각 WCAG 4.5:1을 맞춘다 — 같은 색으로 밝은/어두운 배경 양쪽 대비를 동시에 만족시키는 건 명도差 때문에 대체로 불가능해서 배경 밝기별로 분리했다. 타이포·모션 같은 구조적 토큰은 축 A(톤) 그대로 유지 — 팔레트만 바뀌고 톤의 "성격"은 안 바뀜
- **반응형 폭 규칙**: 카드 폭이 `clamp(480px, 55vw, 700px)`. `.mhp-page` 자체는 폭을 제한하지 않고, Hero 배경·Topbar·StickyCta·갤러리 그리드는 배경이 뷰포트 전체 폭(풀블리드)까지 퍼진다. 나머지 블록(TrustStrip/About/Menu/Reviews/HowItWorks/Faq/Info)도 각자 `mhp-band`로 감싸 배경을 풀블리드로 채우고, 안쪽 `mhp-container`만 카드 폭으로 텍스트를 정렬 — 데스크톱에서 카드 바깥이 빈 여백으로 남지 않도록 하는 장치(design-guide.md 6-1장). 밴드는 밝음(`--paper`)·보조 밝음(`--paper-alt`)·어두움(`--brand-deep`, `--accent-on-dark`)을 블록별로 번갈아 써서 스크롤 시 섹션 구분이 드러난다
- **null 폴백**: 사진 없으면 톤 브랜드 색+도트 텍스처, 로고 없으면 텍스트 로고타입, about/gallery/reviews/how_it_works/faq는 블록째로 렌더링 트리에서 제거(빈 공간 안 남김)
- **폰트 CDN**: Gmarket Sans·S-Core Dream 모두 `next/font/google`의 번들 메타데이터에 korean subset이 빠져있어서(라틴만 인식), `jsdelivr` + `fonts-archive` GitHub 저장소 스타일시트를 `layout.tsx`에서 직접 `<link>`로 로드

## 9. 배포

- **Vercel**: GitHub 레포(`whatsyourbeem/cornerpage`) 연동, `main` push 시 자동 배포
- **도메인**: `cornerpage.co` 등록기관은 Porkbun, 네임서버는 Vercel로 위임(`ns1/ns2.vercel-dns.com`) — 와일드카드 도메인(`*.cornerpage.co`)의 SSL 인증서 자동 발급(DNS-01 challenge)이 Vercel이 DNS 존을 직접 제어해야만 가능해서 네임서버 위임이 사실상 필수였음
- **환경변수**(Vercel 프로젝트 설정에 등록 필요):
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase-Vercel 연동이 자동 동기화
  - `SUPABASE_SECRET_KEY` — 서버 전용(RLS 우회), 마찬가지로 자동 동기화됨. **절대 `NEXT_PUBLIC_` 접두사 붙이면 안 됨**(브라우저에 노출되어 RLS 우회 키가 유출됨)
  - `ANTHROPIC_API_KEY` — 콘텐츠 생성용 Claude API 키. 수동으로 등록해야 함(Supabase처럼 자동 동기화 안 됨)
  - 지오코딩(`geocode.ts`)은 OpenStreetMap Nominatim을 쓰므로 별도 키 불필요
- **`maxDuration`**: `/api/sites`는 `export const maxDuration = 120`으로 늘려뒀다 — Claude 콘텐츠 생성이 재시도 없이도 70초 넘게 걸리는 경우가 실측됨. Vercel Hobby 플랜은 이 값과 무관하게 60초로 강제 제한되니, 운영 중 타임아웃이 잦으면 플랜 업그레이드 필요

## 10. 로컬 개발

```bash
npm install
```

`.env.local` 필요(`.gitignore`됨, 커밋 금지):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
ANTHROPIC_API_KEY=...
```

```bash
npm run dev
```

`predev` 훅이 `scripts/build-skill-prompt.ts`를 먼저 돌려 `spec/skill/` 문서를 `src/lib/skill-prompt.generated.ts`로 결합한다(4절 참고) — `spec/skill/` 아래 파일을 수정했으면 dev 서버를 재시작해야 반영된다.

- `http://localhost:3000` — 루트 랜딩 페이지
- `http://localhost:3000/create` — 6단계 질문형 입력 폼
- `http://localhost:3000/preview` — DB에 있는 전체 사이트 목록(개발용)
- `http://{slug}.localhost:3000` — 서브도메인 라우팅 테스트 (예: `cafe-millmuldabang.localhost:3000`)

⚠️ Turbopack `.next` 캐시가 가끔 코드를 변경해도 예전 상태(옛 함수명, 옛 폰트 등)를 계속 서빙하는 문제가 반복적으로 있었다. 변경이 반영 안 되는 것 같으면 `rm -rf .next` 후 서버 재시작부터 시도할 것.

## 11. Git 워크플로우

- `main`: 프로덕션. Supabase 마이그레이션이 여기서 트리거되고, Vercel도 여기서 배포됨
- `develop`: 기능 작업. 완료되면 `main`으로 PR
- 스키마 변경(`supabase/migrations/*.sql`)은 절대 MCP로 직접 원격에 적용하지 않고, 항상 git에 커밋 → `main` push → GitHub 연동 자동 배포 흐름을 따른다(레포와 실제 DB 상태가 어긋나는 걸 방지)

## 12. 다음 단계

1. **유저 인증/소유권**: 지금은 `sites`에 owner 개념이 없음. 슬러그 변경 같은 기능을 유저 본인만 하게 하려면 필요
2. **슬러그 커스터마이징 UI**: 예약어(`www`/`api`/`admin` 등) 차단 로직 포함
3. **생성 결과 재시도/피드백 UX**: 현재는 1회 자동 재시도 후 실패하면 502를 그대로 반환 — 유저에게 재시도 버튼이나 부분 실패 안내가 없음
4. **레이트리밋/어뷰즈 방지**: `/api/sites`가 Claude API를 직접 호출하므로, 무제한 반복 제출에 대한 방어가 아직 없음
5. **슬러그 커스터마이징 UI**: 예약어(`www`/`api`/`admin` 등) 차단 로직 포함
