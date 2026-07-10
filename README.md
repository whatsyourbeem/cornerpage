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

이 프로젝트는 **6번부터 거꾸로** 구현해왔다. "콘텐츠 JSON이 이미 있다고 가정했을 때 그걸 어떻게 예쁘게, 어떤 URL로 보여줄 것인가"를 먼저 완성하고, 그 다음 "콘텐츠 JSON을 어떻게 만들어서 저장할 것인가"로 거슬러 올라가는 순서다. 그래서 지금 시점에는 6→4번은 실제로 동작하고, 3번(진짜 LLM 생성)과 1번(진짜 입력 폼 UI)은 아직 자리만 잡혀있다.

## 2. 구현 상태

| 단계 | 상태 | 비고 |
|---|---|---|
| 1. 입력 폼 | 🟡 임시 | `/create` — 파이프라인 검증용 뼈대 폼. 실제 질문형 UX 아님 |
| 2. 백엔드 API | 🟡 임시 | `/api/sites/draft`, `/api/upload`, `/api/sites` 존재. 스키마 검증(ajv 등) 없음 |
| 3. LLM 콘텐츠 생성 | 🔴 목업 | `src/lib/mock-generate-content.ts`가 폼 입력을 스키마 모양대로 조립만 함. 실제 Claude 호출 없음 |
| 4. DB 저장 | 🟢 완료 | Supabase `sites` 테이블, RLS, GitHub 연동 마이그레이션 |
| 5. URL 안내 | 🟢 완료 | `/create` 제출 후 결과 화면에 표시 |
| 6. 렌더링 + 배포 | 🟢 완료 | 서브도메인 라우팅, 디자인 템플릿 10블록, Vercel 배포, 커스텀 도메인 |

## 3. 기술 스택

- **Next.js 16** (App Router, Turbopack) — ⚠️ 이 버전은 학습 데이터 기준과 다른 breaking change가 있다. 예: `middleware.ts`가 `proxy.ts`로 이름이 바뀌고 `export function proxy`를 씀. 새 API를 쓰기 전엔 `node_modules/next/dist/docs/`를 먼저 확인할 것 (`AGENTS.md` 참고).
- **TypeScript**
- **Tailwind CSS v4** — 레이아웃 보조용으로만 소량 사용. 디자인은 대부분 CSS Modules + CSS 커스텀 프로퍼티(토큰) 기반
- **Supabase** — Postgres DB, Storage, GitHub 연동 자동 마이그레이션 배포
- **Vercel** — 배포, 커스텀 도메인(`cornerpage.co` + 와일드카드)
- **Pretendard**(자체 호스팅 가변 폰트, 본문 공통) + 톤별 헤드라인 서체(Gmarket Sans / Pretendard Black / S-Core Dream, jsdelivr `fonts-archive` CDN으로 로드 — 이유는 8절 참고)

## 4. 콘텐츠 스키마

렌더러의 입력 계약은 `src/lib/content-types.ts`의 `MiniHomepageContent`. 원본 스키마 문서는 `design-guide.md`(디자인 규칙)와 `handoff-README.md`(핸드오프 배경)에 있다.

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
    about, gallery, reviews,             // nullable (블록째로 꺼짐)
    menu,                                // item_price | item_consult | package_table 3분기
    info, sticky_cta,                    // 필수
    how_it_works, faq,                   // nullable
  };
}
```

핵심 원칙: **LLM(스킬)은 카피·블록 온오프·톤 판단만 하고, 이미지 URL이나 brand_color처럼 이미 확정된 값은 그대로 통과시키기만 한다.** 렌더러는 이 JSON을 받아 LLM 호출 없이 결정적으로 화면을 그린다.

## 5. 프로젝트 구조

```
src/
  app/
    page.tsx                    루트(cornerpage.co) 랜딩 — 아직 placeholder
    create/page.tsx              파이프라인 검증용 임시 입력 폼
    site/[slug]/page.tsx         실서비스 렌더링 경로 (proxy.ts가 여기로 rewrite)
    preview/page.tsx             개발용 — DB의 전체 사이트 목록
    preview/[slug]/page.tsx      개발용 — 톤/레이아웃/브랜드컬러 스위처 얹은 프리뷰
    api/
      sites/draft/route.ts       site id(uuid) 발급
      upload/route.ts            이미지 업로드 → Supabase Storage
      sites/route.ts             폼 답변 → (목업)콘텐츠 생성 → DB insert
  components/site/
    MiniHomepageSite.tsx         최상위 렌더러 — 레이아웃 조립 + 브랜드컬러 오버라이드
    blocks/                      10개 블록 컴포넌트 (Topbar/Hero/TrustStrip/About/Menu/
                                  Gallery/Reviews/Info/StickyCta/HowItWorks/Faq)
    shared/                      CtaButton, SmartImage(이미지 실패 폴백)
  lib/
    content-types.ts             스키마 타입 (source of truth)
    tone.ts                      톤/레이아웃 매핑 + brand_color 오버라이드 로직
    color.ts                     브랜드 컬러 → 팔레트 유도 (WCAG 대비 보정)
    cta.ts                       CTA 목적지 href 계산
    hours.ts                     영업시간 포맷팅
    supabase.ts                  공개 읽기 전용 클라이언트 (publishable key)
    supabase-admin.ts            서버 전용 쓰기 클라이언트 (secret key, RLS 우회)
    sites.ts                     getSiteBySlug / listSites
    mock-generate-content.ts     임시 콘텐츠 생성기 (실제 LLM 호출로 교체 예정)
  proxy.ts                       서브도메인 → /site/[slug] rewrite (구 middleware.ts)
supabase/
  migrations/                    스키마 변경 이력 (GitHub 연동이 main push 시 자동 적용)
design-guide.md                  디자인 톤/레이아웃/반응형/null폴백 규칙 원본
handoff-README.md                0단계 핸드오프 배경 문서 원본
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
- **brand_color 오버라이드**: 사장님이 브랜드 컬러를 지정하면 그 hex를 씨앗 삼아 `--brand`/`--brand-deep`/`--accent`/`--button-text`를 결정적으로 유도(`src/lib/color.ts`). WCAG 4.5:1 미달이면 색조는 유지한 채 명도만 조정. 타이포·모션 같은 구조적 토큰은 축 A(톤) 그대로 유지 — 팔레트만 바뀌고 톤의 "성격"은 안 바뀜
- **반응형 폭 규칙**: 카드 폭이 `clamp(480px, 55vw, 700px)`로 모바일~데스크톱 소폭 확장. 히어로 배경·topbar·갤러리 그리드 3개만 카드 폭을 벗어나 풀블리드로 확장 가능하고, 나머지 블록은 카드 폭 안에 머물며 바깥은 톤 낮춘 배경(`--page-backdrop`)이 보임
- **null 폴백**: 사진 없으면 톤 브랜드 색+도트 텍스처, 로고 없으면 텍스트 로고타입, about/gallery/reviews/how_it_works/faq는 블록째로 렌더링 트리에서 제거(빈 공간 안 남김)
- **폰트 CDN**: Gmarket Sans·S-Core Dream 모두 `next/font/google`의 번들 메타데이터에 korean subset이 빠져있어서(라틴만 인식), `jsdelivr` + `fonts-archive` GitHub 저장소 스타일시트를 `layout.tsx`에서 직접 `<link>`로 로드

## 9. 배포

- **Vercel**: GitHub 레포(`whatsyourbeem/cornerpage`) 연동, `main` push 시 자동 배포
- **도메인**: `cornerpage.co` 등록기관은 Porkbun, 네임서버는 Vercel로 위임(`ns1/ns2.vercel-dns.com`) — 와일드카드 도메인(`*.cornerpage.co`)의 SSL 인증서 자동 발급(DNS-01 challenge)이 Vercel이 DNS 존을 직접 제어해야만 가능해서 네임서버 위임이 사실상 필수였음
- **환경변수**(Vercel 프로젝트 설정에 등록 필요):
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — Supabase-Vercel 연동이 자동 동기화
  - `SUPABASE_SECRET_KEY` — 서버 전용(RLS 우회), 마찬가지로 자동 동기화됨. **절대 `NEXT_PUBLIC_` 접두사 붙이면 안 됨**(브라우저에 노출되어 RLS 우회 키가 유출됨)

## 10. 로컬 개발

```bash
npm install
```

`.env.local` 필요(`.gitignore`됨, 커밋 금지):
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
```

```bash
npm run dev
```

- `http://localhost:3000` — 루트(입력 폼 자리)
- `http://localhost:3000/create` — 파이프라인 검증용 임시 폼
- `http://localhost:3000/preview` — DB에 있는 전체 사이트 목록(개발용)
- `http://{slug}.localhost:3000` — 서브도메인 라우팅 테스트 (예: `cafe-millmuldabang.localhost:3000`)

⚠️ Turbopack `.next` 캐시가 가끔 코드를 변경해도 예전 상태(옛 함수명, 옛 폰트 등)를 계속 서빙하는 문제가 반복적으로 있었다. 변경이 반영 안 되는 것 같으면 `rm -rf .next` 후 서버 재시작부터 시도할 것.

## 11. Git 워크플로우

- `main`: 프로덕션. Supabase 마이그레이션이 여기서 트리거되고, Vercel도 여기서 배포됨
- `develop`: 기능 작업. 완료되면 `main`으로 PR
- 스키마 변경(`supabase/migrations/*.sql`)은 절대 MCP로 직접 원격에 적용하지 않고, 항상 git에 커밋 → `main` push → GitHub 연동 자동 배포 흐름을 따른다(레포와 실제 DB 상태가 어긋나는 걸 방지)

## 12. 다음 단계

1. **실제 LLM 생성 연동**: `src/lib/mock-generate-content.ts`를 `mini-homepage-builder` 스킬의 실제 Claude API 호출로 교체. 이미지 URL은 지금처럼 API가 직접 대입(LLM이 URL을 타이핑하게 하지 않음)
2. **콘텐츠 JSON 스키마 검증**: API 레이어에 ajv 등으로 런타임 검증 추가(LLM 출력은 우리가 만든 목업과 달리 타입 보장이 안 됨)
3. **진짜 입력 폼 UX**: `/create`를 질문형 멀티스텝 UI로 교체
4. **유저 인증/소유권**: 지금은 `sites`에 owner 개념이 없음. 슬러그 변경 같은 기능을 유저 본인만 하게 하려면 필요
5. **슬러그 커스터마이징 UI**: 예약어(`www`/`api`/`admin` 등) 차단 로직 포함
