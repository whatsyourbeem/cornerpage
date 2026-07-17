# cornerpage-dev-package

> ⚠️ **이 폴더(그리고 저장소에 편입된 뒤의 `spec/`)는 참고 문서가 아니라 빌드 의존성입니다.** `scripts/build-skill-prompt.ts`가 빌드 시점에 `for-claude-api/` 안의 파일들을 vertical별로 읽어 `skill-prompt.generated.ts`를 만들고, `generate-content.ts`가 `for-frontend/{vertical}/content.schema.json`을 런타임에 직접 import해서 ajv 검증에 씁니다. **이 폴더를 지우거나 옮기면 빌드가 깨집니다.** "그냥 문서니까 정리해도 되겠지"라고 판단하지 마세요.

코너페이지 프로젝트의 개발 참고 자료 통합 패키지. 예전엔 "핸드오프 패키지"(디자인)와 "스킬"(콘텐츠 생성)이 별도 zip으로 관리됐는데, 관리 부담을 줄이기 위해 하나로 합쳤습니다. 다만 **내부 폴더 경계는 여전히 엄격합니다** — 이유는 아래 1장 참고.

## 0. 이 문서부터 읽으세요

Claude Code 세션이든, 사람이든, 이 프로젝트에 새로 합류하면 이 README를 먼저 읽고 시작합니다.

## 1. 폴더 구조와 경계 (가장 중요)

폴더는 **"어떤 파일인가"가 아니라 "누가 읽는가"**로 나뉩니다. 이렇게 하면 각 폴더를 통째로 읽어도 그 자체로 안전하도록(엉뚱한 소비자에게 엉뚱한 내용이 새지 않도록) 설계할 수 있습니다.

```
cornerpage-dev-package/
├── for-claude-api/       Claude API 시스템 프롬프트로 실제 전송됨(방법B). 통째로 glob해서
│   │                       읽어도 안전하도록 이 폴더 안엔 API에 보낼 파일만 있다.
│   ├── SKILL.md
│   ├── copywriting.md                 (모든 vertical 공통 — 블록 구조와 무관한
│   │                                    순수 카피 작성 원칙이라 유일하게 안 갈라짐)
│   ├── general/                        ("업종 무관"도 vertical 목록의 기본값 항목
│   │                                     하나로 취급 — 매칭되는 vertical이 없을 때 씀)
│   │   ├── blocks.md
│   │   ├── schema-summary.md          (구조 정의의 유일한 원본 — schema.md는 폐기됨)
│   │   └── industry-data.md
│   └── boutique-fitness/               (PT·필라테스·요가 등 소수정예 지도형, 작성 중)
│       ├── blocks.md                   (전 블록 완성 — 신규 3종 transformations·professionals·facility 포함 11개 블록 전부 층1~2.5 기록됨)
│       ├── schema-summary.md          (분기 완료 — general과 구조가 다름)
│       └── industry-data.md           (작성 완료)
│
├── for-frontend/          프론트엔드·렌더러 구현자용. Claude API에는 절대 안 실림.
│   ├── general/
│   │   ├── content.schema.json         (ajv 검증용 정식 JSON Schema)
│   │   ├── content.types.ts            (TypeScript 타입)
│   │   ├── design-guide.md             (축A/B 기반 톤 시스템 — general 전용)
│   │   └── input-questions.md          (입력 폼 설계 스펙)
│   ├── boutique-fitness/
│   │   ├── content.schema.json         (분기 완료 — 신규 블록 3종·professionals 필수화 반영, ajv 검증 통과)
│   │   ├── content.types.ts            (분기 완료)
│   │   ├── design-guide.md             (고정 톤 "차분한 확신" — 이 vertical은 축 없이 톤 고정)
│   │   └── input-questions.md          (작성 완료)
│   └── fixtures/           검증된 콘텐츠 JSON, vertical별 분리 완료
│       ├── general/          (5종: 밀물다방·삼보토탈·네일오브윤·수지좋은치과·아이비스터디카페)
│       └── boutique-fitness/ (1종: 지음필라테스 — 신규 스키마 기준, ajv로 검증 완료)
│
├── for-context/            사람(또는 다음 세션의 Claude)이 배경·설계 근거를 이해하기 위한 문서.
│   └── boutique-fitness/     어떤 시스템도 프로그램적으로 읽지 않는다.
│       └── definition.md    ("좋은 홈페이지" 정의 — 이 vertical에만 존재. general은
│                              SKILL.md의 7대 원칙이 이 역할을 겸해서 별도 파일이 없다)
│
└── evals/                  QA 테스트케이스. API로는 안 보내지만 그 결과물을 검증하는 자산.
    └── evals.json           (general 10개 케이스로 이미 채워짐 — 값어치 있는 기존 자산이라 유지)
```

**이전엔 최상위가 `schema/`·`skill/`·`design/`(파일 종류 기준)이었습니다.** 재구조화한 이유:

1. **`skill/` 폴더 안에도 API로 안 보내는 파일(`input-questions.md`, `definition.md`)이 섞여 있었습니다.** 처음엔 `prompt-` 파일명 접두사로 구분했는데, 이건 사람이 규칙을 기억해야만 지켜지는 느슨한 장치라 — 나중에 빌드 스크립트가 "이 폴더 `.md` 전부 읽기" 같은 지름길을 택하면 그대로 새어 들어갈 위험이 있었습니다. **폴더 자체를 역할로 나누면 이 위험이 구조적으로 없어집니다** — `for-claude-api/`를 통째로 읽어도 애초에 그 안엔 보내도 되는 파일만 있으니까요.
2. **`schema/`가 최상위로 독립돼 있던 이유**(백엔드 ajv 검증과 렌더러 타입 둘 다 참조하는 단일 소스)와 **`design/design-guide.md`가 있던 이유**(렌더러 스타일링)는 둘 다 결국 "프론트엔드/렌더러가 보는 것"이라는 같은 소비자였습니다. 굳이 최상위에서 따로 두 갈래로 나눌 이유가 없어 `for-frontend/`로 합쳤습니다.
3. **`definition.md`(boutique-fitness의 설계 배경 문서)는 API에도 프론트엔드에도 안 쓰이는, 순수 "다음 사람을 위한 설명"이라 별도 역할(`for-context/`)로 뺐습니다.**

`schema/`가 vertical별로 갈라지는 이유(업종별 콘텐츠 구조가 완전히 다름), `design-guide.md`가 vertical별로 갈라지는 이유(general은 축A/B로 업체마다 분류, boutique-fitness는 definition.md가 확정한 논리로 블록 구성·톤을 통째로 고정)는 이전 결정 그대로입니다 — 위치만 `for-frontend/{vertical}/` 아래로 옮겨졌습니다. `meta.brand_color` 오버라이드 로직(씨앗 색 기반 결정적 팔레트 생성)은 두 vertical이 동일하게 공유하며, boutique-fitness의 design-guide.md는 이 부분을 재정의하지 않고 general 문서를 참조합니다.

> **참고**: 원래 구조 정의는 `schema.md`(완성 예시 포함, 사람이 읽는 문서)와 `schema-summary.md`(구조만, 프롬프트용) 두 파일로 나뉘어 있었으나, `schema.md`의 완성 예시가 `fixtures/*.json`과 완전히 중복 저장되고 있는 게 발견되어(byte-for-byte 동일) `schema.md`를 삭제하고 `schema-summary.md` 하나로 통합했습니다(2026-07-16). 구조를 사람이 확인할 땐 `schema-summary.md`를, 완성 예시가 필요하면 `for-frontend/fixtures/{vertical}/`를 직접 봅니다.

**`copywriting.md`가 vertical별로 안 갈라지는 이유**: "사실 번역", "AI 티 방지", "최상급·비교 표현 회피" 같은 원칙은 업종과 무관하게 항상 적용되도록 의도적으로 설계되어 있습니다(문서 자체에 "업종·규제 여부와 무관하게 모든 카피에 적용하는 일반 원칙"이라고 명시 — 업종별 판단을 요구하면 오판 위험이 생기기 때문). 반면 "톤에 따라 문구가 어떻게 달라지는가"(예: 신뢰형은 CTA에 "24시간 상담" 라벨)는 이미 vertical별 `blocks.md`가 담당하고 있어, `copywriting.md`를 쪼갤 필요가 없습니다.

**왜 `for-claude-api/`와 `for-frontend/`를 절대 섞으면 안 되는가**: `SKILL.md`가 지정한 파일들만 매 콘텐츠 생성 요청마다 Claude API 시스템 프롬프트로 실려 토큰 비용이 발생합니다. 디자인 문서(CSS·hex값 등)가 실수로 이 안에 섞이면 (1) 콘텐츠 생성과 무관한 내용에 비용이 새고, (2) 매 파일마다 "이거 프롬프트에 실리나?"를 확인해야 하는 인지 부담이 생깁니다. (실제로 이번 프로젝트 진행 중 `blocks.md` 초안에 디자인 값을 섞어 넣었다가 바로잡은 사고가 있었습니다 — 폴더 분리가 왜 필요한지 보여주는 실증 사례입니다.)

## 2. Claude API 호출 시 실제로 무엇이 전송되는가

`for-claude-api/`를 실제 Claude API로 호출할 때(방법B, 상세는 별도 "백엔드 API 아키텍처" 문서), 시스템 프롬프트에 결합되는 파일은 정확히 이 5개입니다. 백엔드가 요청 전에 vertical을 먼저 판별해, 그 vertical 폴더 하위의 3개 파일을 골라 넣습니다:

```
for-claude-api/SKILL.md
for-claude-api/copywriting.md                          (공통, vertical 무관)
for-claude-api/{vertical}/blocks.md
for-claude-api/{vertical}/schema-summary.md
for-claude-api/{vertical}/industry-data.md
```

`for-frontend/`·`for-context/`·`evals/`는 이 흐름에 전혀 등장하지 않습니다 — `input-questions.md`는 폼 제출 시점에 이미 정보가 모여있어 생성 단계에선 불필요하고, `content.schema.json`(원본 JSON Schema)은 사후 ajv 검증에만 씁니다.

## 3. 업종(vertical) 라우팅

`SKILL.md` 1단계에 라우팅 규칙이 있습니다. `for-claude-api/` 하위에 등록된 vertical 목록(현재 `boutique-fitness`, `general`) 중 사업 정보와 매칭되는 것을 고릅니다. **`general`은 "업종 무관 예외 처리"가 아니라, 매칭되는 전문 vertical이 없을 때 쓰는 vertical 목록의 기본값 항목**입니다 — 구조적으로 다른 vertical과 동등하게 취급합니다. 장기적으로는 이 vertical 목록만으로 라우팅하고, 업종별 전문 vertical이 늘어날수록 `general`이 커버하는 범위는 줄어드는 방향입니다.

실제 백엔드에서는 이 라우팅을 LLM이 실행 중에 고르는 게 아니라, **백엔드 코드가 요청 전에 미리 결정**해서 그에 맞는 시스템 프롬프트(vertical마다 하나씩)를 골라 보내야 합니다(방법B 특성상). vertical이 늘어날수록 백엔드가 관리할 시스템 프롬프트 종류도 그만큼 늘어난다는 뜻입니다.

**boutique-fitness vertical의 모든 참고 파일이 완성되었습니다**(2026-07-16) — `definition.md`·`blocks.md`·`schema-summary.md`·`content.schema.json`·`content.types.ts`·`design-guide.md`·`input-questions.md`·`industry-data.md` 전부 작성 완료.

## 4. claude.ai에서 스킬만 테스트하고 싶을 때 (API 비용 없이)

`for-claude-api/` 폴더만 압축해서 claude.ai의 스킬 등록 기능에 올리면 됩니다(등록 시 폴더 루트에 `SKILL.md`가 오도록). **`for-frontend/`나 `for-context/`는 등록하지 않습니다** — 등록하면 Claude가 스킬 탐색 중 디자인 문서를 우연히 읽어 콘텐츠 생성에 섞일 위험이 있고, 애초에 실제 프로덕션(API, 방법B)이 보는 것과 다른 조건에서 테스트하게 되어 테스트 의미가 흐려집니다.

생성된 콘텐츠 JSON이 스키마에 맞는지 확인하고 싶으면, 결과를 개발 세션(Claude와의 대화)에 붙여넣어 해당 vertical의 `for-frontend/{vertical}/content.schema.json`으로 검증받으면 됩니다.

## 5. 소스 오브 트루스 원칙

이 패키지(정확히는 각 파일의 원본)가 정본입니다. Notion은 사람이 읽는 사본이며, 명시적으로 요청받았을 때만 이 패키지 내용을 보고 문서화합니다 — 자동으로 역반영하지 않습니다.

## 6. 저장소(cornerpage repo) 편입 시 주의사항

이 패키지를 `cornerpage` 저장소의 `spec/` 폴더로 편입하고, 기존 저장소 루트의 `skill/`(지금까지 실제로 쓰이던 폴더)은 삭제하는 방식으로 통합합니다.

**삭제 전 필수 절차**: 저장소의 기존 `skill/`과 이 패키지의 `for-claude-api/`를 **반드시 diff**해서 차이가 있는지 확인하세요. Claude Code가 그동안 저장소에서 직접 스킬 파일을 수정했을 수 있어(예: 버그 수정 과정에서), 그냥 덮어쓰면 그 변경사항이 조용히 사라질 수 있습니다. 차이가 있으면 삭제하지 말고 먼저 알려주세요.

**경로 변경 필요**: 저장소 루트의 `skill/`이 `spec/for-claude-api/`로, `content.schema.json`이 `spec/for-frontend/{vertical}/`로 이동하므로, 이걸 import/read하는 코드의 경로를 전부 갱신해야 합니다:
- `scripts/build-skill-prompt.ts`의 파일 읽기 경로 — **vertical별로 다른 파일을 읽어 시스템 프롬프트를 조립하도록 분기 로직 자체를 새로 작성**해야 합니다(2장의 5개 파일 목록 참고). vertical 판별 → `for-claude-api/{vertical}/`의 3개 파일 + `for-claude-api/` 바로 아래 공통 2개 파일(`SKILL.md`, `copywriting.md`)을 조합하는 구조입니다. **`for-claude-api/` 폴더 전체를 통째로 glob해서 읽어도 안전**하도록 설계돼 있으니, vertical 하위 폴더까지만 정확히 지정하면 됩니다.
- `src/lib/generate-content.ts`의 `import contentSchema from "..."` 경로 → vertical에 따라 `spec/for-frontend/{vertical}/content.schema.json` 중 하나를 골라 import(혹은 동적으로 로드)하도록 변경. ajv 검증도 vertical별로 다른 스키마 인스턴스를 써야 합니다.
- `content.types.ts`를 프론트엔드/렌더러 쪽에서 쓰고 있었다면, 그것도 `spec/for-frontend/{vertical}/content.types.ts`를 가리키도록 vertical별로 분기(렌더러도 vertical에 따라 다른 컴포넌트를 그려야 하므로 이 분기는 어차피 필요합니다).
- **DB 스키마도 함께 손볼 필요**: 공통 `sites` 테이블(소유자·slug·도메인·업종카테고리 등) + vertical별 콘텐츠 테이블(예: `general_content`, `boutique_fitness_content`, 각각 블록 단위 jsonb 컬럼)로 분리하기로 확정했습니다. 기존에 단일 `pages` 테이블에 콘텐츠를 통짜 jsonb로 저장하고 있었다면, 이 마이그레이션도 함께 계획해야 합니다.

편입 후 최종 구조:
```
cornerpage/                    (기존 저장소)
├── src/                       (기존 앱 코드)
├── supabase/
└── spec/                      ← 이 패키지가 통째로 여기로
    ├── README.md              (이 문서)
    ├── for-claude-api/
    ├── for-frontend/
    ├── for-context/
    └── evals/
```

## 7. 다음 단계

- [x] `for-context/boutique-fitness/definition.md` 작성 완료
- [x] `for-frontend/boutique-fitness/design-guide.md` 작성 완료(고정 톤 "차분한 확신")
- [x] 최상위 폴더를 파일 종류(`schema`/`skill`/`design`) 기준에서 역할(`for-claude-api`/`for-frontend`/`for-context`/`evals`) 기준으로 재구조화(2026-07-16)
- [x] `for-claude-api/boutique-fitness/blocks.md` 완성 — 11개 블록(신규 3종 transformations·professionals·facility 포함) 전부 층1(슬롯 구조)·층2(작성 원칙)·층2.5(좋은/나쁜 예) 기록 완료. 필수 블록 목록도 확정(topbar·hero·trust_strip·professionals·menu·info·sticky_cta).
- [x] `for-claude-api/boutique-fitness/schema-summary.md`·`for-frontend/boutique-fitness/content.schema.json`·`content.types.ts` 분기 완료(2026-07-16) — `blocks.md` 결론 전부 반영(신규 블록 3종, `about` 제거, `lead_emphasis` 추가, `reviews.trainer_tag` 추가, `professionals` 필수화). ajv로 스키마 문법 검증 + 실제 fixture(`pilates-jieum.json`) 검증 통과 확인
- [x] `for-frontend/boutique-fitness/input-questions.md` 작성 완료(2026-07-16) — 마찰 최소화 원칙(general 6개 계승) + 증거 자료(비포애프터·리뷰) 구간에 한정된 동기 문구, 회원 초상권 동의 안내, `lead_emphasis` 질문 포함
- [x] `for-claude-api/boutique-fitness/industry-data.md` 작성 완료(2026-07-16) — 강점 후보를 general처럼 업종 전체가 아니라 블록별로 정리(어느 강점이 어느 블록을 보강하는지 명확화), 이용흐름 표준 골격, 예상 FAQ 세트 포함. general의 "업종 2축 분류표"는 해당 없어 생략(이유 명시)
- [ ] `evals/boutique-fitness-evals.json` 신설 (부티크 피트니스 전용 테스트 케이스, general의 `evals.json`과 분리할지 같은 파일에 vertical 필드로 구분할지는 미정)
- [ ] 백엔드의 `build-skill-prompt.ts`가 vertical별로 프롬프트(현재 general/boutique-fitness 2종, 향후 vertical 추가 시 확장)를 만들도록 재작성
- [ ] DB: 공통 `sites` 테이블 + vertical별 콘텐츠 테이블(블록 단위 jsonb 컬럼) 마이그레이션 설계 및 적용
- [ ] `generate-content.ts`가 vertical에 따라 다른 ajv 스키마 인스턴스를 골라 검증하도록 수정
- [x] `for-frontend/fixtures/` vertical별 분리 완료(2026-07-16) — `general/`(5종)·`boutique-fitness/`(1종: 지음필라테스, ajv 검증 통과). `gym-thorgym.json`은 완전히 폐기(신규 스키마 미반영 + 라우팅상 boutique-fitness 업종인데 general 폴더에 있던 오류) — `pilates-jieum.json`이 대체
