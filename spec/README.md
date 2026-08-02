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
│   │   ├── schema-summary.md          (구조 정의 + 필드별 작성 원칙 인라인 주석 + 고위험
│   │   │                                블록 압축 예시 — 이 vertical 구조의 유일한 원본)
│   │   └── industry-data.md
│   └── boutique-fitness/               (PT·필라테스·요가 등 소수정예 지도형)
│       ├── schema-summary.md          (분기 완료, 위와 동일한 성격)
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
│   │                        어떤 시스템도 프로그램적으로 읽지 않는다 — API 비용과 무관.
│   ├── general/
│   │   └── blocks.md         (블록별 작성 원칙의 전체 근거·모든 예시 — 2026-07-16까지는
│   │                           for-claude-api/에 있었으나, 실질 지침이 이미 schema-summary.md에
│   │                           압축되어 있어 프롬프트에서 뺐다. 아래 "왜 blocks.md를 뺐는가" 참고)
│   └── boutique-fitness/
│       ├── definition.md    ("좋은 홈페이지" 정의 — 이 vertical에만 존재. general은
│       │                      SKILL.md의 7대 원칙이 이 역할을 겸해서 별도 파일이 없다)
│       └── blocks.md         (위 general/blocks.md와 같은 이유로 이동)
│
└── evals/                  QA 테스트케이스. API로는 안 보내지만 그 결과물을 검증하는 자산.
    └── evals.json           (general 10개 케이스로 이미 채워짐 — 값어치 있는 기존 자산이라 유지)
```

### 왜 `blocks.md`를 `for-claude-api/`에서 뺐는가 (2026-07-16)

원래 `blocks.md`(블록별 작성 원칙 + 좋은/나쁜 예)도 매 요청마다 프롬프트에 실렸습니다. 그런데 boutique-fitness 작업 중 실제로 대조해보니, `blocks.md`의 실질적 지침(예: "메뉴 대신 업종 언어로", "item_consult가 기본값")이 **이미 `schema-summary.md`의 필드별 인라인 주석에 그대로 들어있었습니다** — `blocks.md`가 추가로 주는 건 (1) "general은 이런데 왜 다르게 갔는지" 근거, (2) 좋은/나쁜 예시뿐이었습니다.

근거는 사람(설계를 검토하거나 새 vertical을 만드는 사람)에게는 중요하지만 **콘텐츠를 생성하는 그 순간의 LLM에게는 불필요**합니다. 그래서:
- `blocks.md`를 `for-context/`로 이동(더 이상 API로 전송 안 됨)
- 예시 중 사실 조작·AI 티 위험이 큰 블록(예: boutique-fitness의 `transformations`·`professionals`·`reviews`, general의 `hero`·`trust_strip`·`menu`)만 `schema-summary.md` 끝의 "핵심 예시" 절에 압축해서 남김

**결과: boutique-fitness 기준 system 프롬프트가 약 44% 줄었습니다**(실측: 34,372 → 19,019 토큰 추정, 글자수 기준). general도 비율은 다르지만 같은 방향으로 줄었습니다.

주의: `schema.md`를 지울 때와 달리 이번엔 **정본을 통째로 지우지 않았습니다** — `blocks.md`는 여전히 유일한 원본으로 `for-context/`에 남아있고, `schema-summary.md`를 고칠 때 근거가 궁금하면 언제든 참고합니다. 다만 두 파일 간 완전한 동기화 의무는 없습니다(`schema-summary.md`가 실질적으로 자기완결적이기 때문) — `blocks.md`는 "왜"를 설명하는 참고 문서이지, `schema-summary.md`가 파생되어 나오는 원본이 아닙니다.

**이전엔 최상위가 `schema/`·`skill/`·`design/`(파일 종류 기준)이었습니다.** 재구조화한 이유:

1. **`skill/` 폴더 안에도 API로 안 보내는 파일(`input-questions.md`, `definition.md`)이 섞여 있었습니다.** 처음엔 `prompt-` 파일명 접두사로 구분했는데, 이건 사람이 규칙을 기억해야만 지켜지는 느슨한 장치라 — 나중에 빌드 스크립트가 "이 폴더 `.md` 전부 읽기" 같은 지름길을 택하면 그대로 새어 들어갈 위험이 있었습니다. **폴더 자체를 역할로 나누면 이 위험이 구조적으로 없어집니다** — `for-claude-api/`를 통째로 읽어도 애초에 그 안엔 보내도 되는 파일만 있으니까요.
2. **`schema/`가 최상위로 독립돼 있던 이유**(백엔드 ajv 검증과 렌더러 타입 둘 다 참조하는 단일 소스)와 **`design/design-guide.md`가 있던 이유**(렌더러 스타일링)는 둘 다 결국 "프론트엔드/렌더러가 보는 것"이라는 같은 소비자였습니다. 굳이 최상위에서 따로 두 갈래로 나눌 이유가 없어 `for-frontend/`로 합쳤습니다.
3. **`definition.md`(boutique-fitness의 설계 배경 문서)는 API에도 프론트엔드에도 안 쓰이는, 순수 "다음 사람을 위한 설명"이라 별도 역할(`for-context/`)로 뺐습니다.**

`schema/`가 vertical별로 갈라지는 이유(업종별 콘텐츠 구조가 완전히 다름), `design-guide.md`가 vertical별로 갈라지는 이유(general은 축A/B로 업체마다 분류, boutique-fitness는 definition.md가 확정한 논리로 블록 구성·톤을 통째로 고정)는 이전 결정 그대로입니다 — 위치만 `for-frontend/{vertical}/` 아래로 옮겨졌습니다. `meta.brand_color` 오버라이드 로직(씨앗 색 기반 결정적 팔레트 생성)은 두 vertical이 동일하게 공유하며, boutique-fitness의 design-guide.md는 이 부분을 재정의하지 않고 general 문서를 참조합니다.

> **참고**: 원래 구조 정의는 `schema.md`(완성 예시 포함, 사람이 읽는 문서)와 `schema-summary.md`(구조만, 프롬프트용) 두 파일로 나뉘어 있었으나, `schema.md`의 완성 예시가 `fixtures/*.json`과 완전히 중복 저장되고 있는 게 발견되어(byte-for-byte 동일) `schema.md`를 삭제하고 `schema-summary.md` 하나로 통합했습니다(2026-07-16). 구조를 사람이 확인할 땐 `schema-summary.md`를, 완성 예시가 필요하면 `for-frontend/fixtures/{vertical}/`를 직접 봅니다.

**`copywriting.md`가 vertical별로 안 갈라지는 이유**: "사실 번역", "AI 티 방지", "최상급·비교 표현 회피" 같은 원칙은 업종과 무관하게 항상 적용되도록 의도적으로 설계되어 있습니다(문서 자체에 "업종·규제 여부와 무관하게 모든 카피에 적용하는 일반 원칙"이라고 명시 — 업종별 판단을 요구하면 오판 위험이 생기기 때문). 반면 "톤에 따라 문구가 어떻게 달라지는가"(예: 신뢰형은 CTA에 "24시간 상담" 라벨)는 이미 vertical별 `blocks.md`가 담당하고 있어, `copywriting.md`를 쪼갤 필요가 없습니다.

**왜 `for-claude-api/`와 `for-frontend/`를 절대 섞으면 안 되는가**: `SKILL.md`가 지정한 파일들만 매 콘텐츠 생성 요청마다 Claude API 시스템 프롬프트로 실려 토큰 비용이 발생합니다. 디자인 문서(CSS·hex값 등)가 실수로 이 안에 섞이면 (1) 콘텐츠 생성과 무관한 내용에 비용이 새고, (2) 매 파일마다 "이거 프롬프트에 실리나?"를 확인해야 하는 인지 부담이 생깁니다. (실제로 이번 프로젝트 진행 중 `blocks.md` 초안에 디자인 값을 섞어 넣었다가 바로잡은 사고가 있었습니다 — 폴더 분리가 왜 필요한지 보여주는 실증 사례입니다.)

## 2. Claude API 호출 시 실제로 무엇이 전송되는가

`for-claude-api/`를 실제 Claude API로 호출할 때(방법B, 상세는 별도 "백엔드 API 아키텍처" 문서), 시스템 프롬프트에 결합되는 파일은 정확히 이 4개입니다(2026-07-16까지는 5개였으나 `blocks.md`를 뺐습니다 — 1장 참고). 백엔드가 요청 전에 vertical을 먼저 판별해, 그 vertical 폴더 하위의 2개 파일을 골라 넣습니다:

```
for-claude-api/SKILL.md
for-claude-api/copywriting.md                          (공통, vertical 무관)
for-claude-api/{vertical}/schema-summary.md
for-claude-api/{vertical}/industry-data.md
```

`for-frontend/`·`for-context/`·`evals/`는 이 흐름에 전혀 등장하지 않습니다 — `blocks.md`(설계 근거)는 실질 지침이 `schema-summary.md`에 이미 압축되어 있어 불필요, `input-questions.md`는 폼 제출 시점에 이미 정보가 모여있어 생성 단계에선 불필요, `content.schema.json`(원본 JSON Schema)은 사후 ajv 검증에만 씁니다.

## 3. 업종(vertical) 라우팅

`for-claude-api/` 하위에 등록된 vertical 목록(현재 `boutique-fitness`, `general`) 중 하나가 선택됩니다. **`general`은 "업종 무관 예외 처리"가 아니라, 매칭되는 전문 vertical이 없을 때 쓰는 vertical 목록의 기본값 항목**입니다 — 구조적으로 다른 vertical과 동등하게 취급합니다. 장기적으로는 이 vertical 목록만으로 라우팅하고, 업종별 전문 vertical이 늘어날수록 `general`이 커버하는 범위는 줄어드는 방향입니다.

### vertical은 사용자가 직접 고른다 — 시스템이 추론하지 않는다

**vertical의 유일한 결정 근거는 사용자가 `/create` 진입 화면에서 카드 UI로 명시적으로 고른 값입니다.** 이 선택 하나가 이후 라우트(`/create/{vertical}`)·입력 폼 구조·시스템 프롬프트·ajv 스키마·`sites.vertical` 컬럼을 전부 결정합니다. 백엔드는 클라이언트가 보낸 vertical을 그대로 신뢰하며, 검증은 "등록된 vertical 목록에 있는 값인가"까지입니다.

**업종 텍스트로 vertical을 다시 추론하지 않습니다.** 사용자가 별도로 입력하는 업종 자유 텍스트(`meta.industry_category`)는 카피의 업종 언어와 general의 축 판단에 쓰이는 재료일 뿐, 라우팅 근거가 아닙니다.

이 규칙이 중요한 이유는 자체 추론이 사용자의 명시적 선택을 덮어쓸 수 있기 때문입니다. 그렇게 되면 A vertical의 폼으로 모은 답변을 B vertical의 스키마·프롬프트로 처리하게 되어 ajv 검증이 반드시 실패하고, repair loop을 최대 횟수까지 소진한 뒤 생성이 실패합니다(API 비용도 그만큼 배로 나갑니다). 실제로 키워드 매칭 방식(`determineVertical()`, 2026-08 폐기)에서 boutique-fitness 폼의 placeholder 예시 문구인 `"PT 전문 짐"`과 `"피티스튜디오"`가 `general`로 오판정되는 것이 확인됐습니다. 키워드 목록을 늘리는 대응은 같은 문제를 계속 뒤쫓게 되므로 채택하지 않습니다.

한편 **LLM이 실행 중에 vertical을 고르지도 않습니다**(방법B 특성상). 백엔드가 요청 전에 확정된 vertical에 맞는 시스템 프롬프트(vertical마다 하나씩)를 골라 보내므로, LLM에게는 애초에 선택지가 주어지지 않습니다. vertical이 늘어날수록 백엔드가 관리할 시스템 프롬프트 종류도 그만큼 늘어난다는 뜻입니다.

**boutique-fitness vertical의 모든 참고 파일이 완성되었습니다**(2026-07-16) — `definition.md`·`blocks.md`(현재 `for-context/`에 위치, API 미전송)·`schema-summary.md`·`content.schema.json`·`content.types.ts`·`design-guide.md`·`input-questions.md`·`industry-data.md` 전부 작성 완료.

## 4. claude.ai에서 스킬만 테스트하고 싶을 때 (API 비용 없이)

`for-claude-api/` 폴더만 압축해서 claude.ai의 스킬 등록 기능에 올리면 됩니다(등록 시 폴더 루트에 `SKILL.md`가 오도록). **`for-frontend/`나 `for-context/`는 등록하지 않습니다** — 등록하면 Claude가 스킬 탐색 중 디자인 문서를 우연히 읽어 콘텐츠 생성에 섞일 위험이 있고, 애초에 실제 프로덕션(API, 방법B)이 보는 것과 다른 조건에서 테스트하게 되어 테스트 의미가 흐려집니다.

생성된 콘텐츠 JSON이 스키마에 맞는지 확인하고 싶으면, 결과를 개발 세션(Claude와의 대화)에 붙여넣어 해당 vertical의 `for-frontend/{vertical}/content.schema.json`으로 검증받으면 됩니다.

## 5. 소스 오브 트루스 원칙

이 패키지(정확히는 각 파일의 원본)가 정본입니다. Notion은 사람이 읽는 사본이며, 명시적으로 요청받았을 때만 이 패키지 내용을 보고 문서화합니다 — 자동으로 역반영하지 않습니다.

## 6. 저장소(cornerpage repo) 편입 시 주의사항

이 패키지를 `cornerpage` 저장소의 `spec/` 폴더로 편입하고, 기존 저장소 루트의 `skill/`(지금까지 실제로 쓰이던 폴더)은 삭제하는 방식으로 통합합니다.

**삭제 전 필수 절차**: 저장소의 기존 `skill/`과 이 패키지의 `for-claude-api/`를 **반드시 diff**해서 차이가 있는지 확인하세요. Claude Code가 그동안 저장소에서 직접 스킬 파일을 수정했을 수 있어(예: 버그 수정 과정에서), 그냥 덮어쓰면 그 변경사항이 조용히 사라질 수 있습니다. 차이가 있으면 삭제하지 말고 먼저 알려주세요.

**경로 변경 필요**: 저장소 루트의 `skill/`이 `spec/for-claude-api/`로, `content.schema.json`이 `spec/for-frontend/{vertical}/`로 이동하므로, 이걸 import/read하는 코드의 경로를 전부 갱신해야 합니다:
- `scripts/build-skill-prompt.ts`의 파일 읽기 경로 — **vertical별로 다른 파일을 읽어 시스템 프롬프트를 조립하도록 분기 로직 자체를 새로 작성**해야 합니다(2장의 4개 파일 목록 참고). vertical 판별 → `for-claude-api/{vertical}/`의 2개 파일(`schema-summary.md`·`industry-data.md`) + `for-claude-api/` 바로 아래 공통 2개 파일(`SKILL.md`, `copywriting.md`)을 조합하는 구조입니다. **`for-claude-api/` 폴더 전체를 통째로 glob해서 읽어도 안전**하도록 설계돼 있으니, vertical 하위 폴더까지만 정확히 지정하면 됩니다.
- `src/lib/generate-content.ts`의 `import contentSchema from "..."` 경로 → vertical에 따라 `spec/for-frontend/{vertical}/content.schema.json` 중 하나를 골라 import(혹은 동적으로 로드)하도록 변경. ajv 검증도 vertical별로 다른 스키마 인스턴스를 써야 합니다.
- `content.types.ts`를 프론트엔드/렌더러 쪽에서 쓰고 있었다면, 그것도 `spec/for-frontend/{vertical}/content.types.ts`를 가리키도록 vertical별로 분기(렌더러도 vertical에 따라 다른 컴포넌트를 그려야 하므로 이 분기는 어차피 필요합니다).
- **DB 스키마도 함께 손볼 필요**: ~~공통 `sites` 테이블(소유자·slug·도메인·업종카테고리 등) + vertical별 콘텐츠 테이블(예: `general_content`, `boutique_fitness_content`, 각각 블록 단위 jsonb 컬럼)로 분리~~ **(2026-07-17 수정)** — `sites` 테이블 하나에 `content_json jsonb` 컬럼 + 신설한 `vertical text` 컬럼(text+check 제약, enum 아님 — vertical 목록이 계속 늘 걸 이미 알고 있어서)으로 유지하기로 재조정했습니다. 이유: "업종마다 콘텐츠 구조가 다르다"는 것 자체는 jsonb가 이미 자유 구조를 허용하므로 테이블 분리 근거가 안 되고, "구조 개편 시 마이그레이션이 어렵다"는 것도 `vertical` 컬럼으로 `WHERE vertical = 'general'`처럼 범위를 좁혀 마이그레이션하면 되므로 테이블을 나누든 안 나누든 작업량이 같습니다. 블록 단위 컬럼/테이블 분리는 "블록 단위 부분 수정·조회" 같은 구체적 기능이 실제로 필요해지는 시점에 진행합니다. `sites.vertical` 값은 `/api/sites` POST가 클라이언트에게서 받아 검증한 vertical(사용자가 `/create`에서 직접 고른 값, 3장 참고)을 그대로 저장합니다 — 스킬이 값을 판단하지 않고 통과시키는 `brand_color` 패턴과 동일.

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
- [x] `blocks.md`(현재 `for-context/boutique-fitness/blocks.md`) 완성 — 11개 블록(신규 3종 transformations·professionals·facility 포함) 전부 층1(슬롯 구조)·층2(작성 원칙)·층2.5(좋은/나쁜 예) 기록 완료. 필수 블록 목록도 확정(topbar·hero·trust_strip·professionals·menu·info·sticky_cta).
- [x] `for-claude-api/boutique-fitness/schema-summary.md`·`for-frontend/boutique-fitness/content.schema.json`·`content.types.ts` 분기 완료(2026-07-16) — `blocks.md` 결론 전부 반영(신규 블록 3종, `about` 제거, `lead_emphasis` 추가, `reviews.trainer_tag` 추가, `professionals` 필수화). ajv로 스키마 문법 검증 + 실제 fixture(`pilates-jieum.json`) 검증 통과 확인
- [x] `for-frontend/boutique-fitness/input-questions.md` 작성 완료(2026-07-16) — 마찰 최소화 원칙(general 6개 계승) + 증거 자료(비포애프터·리뷰) 구간에 한정된 동기 문구, 회원 초상권 동의 안내, `lead_emphasis` 질문 포함
- [x] `for-claude-api/boutique-fitness/industry-data.md` 작성 완료(2026-07-16) — 강점 후보를 general처럼 업종 전체가 아니라 블록별로 정리(어느 강점이 어느 블록을 보강하는지 명확화), 이용흐름 표준 골격, 예상 FAQ 세트 포함. general의 "업종 2축 분류표"는 해당 없어 생략(이유 명시)
- [x] **API 비용 절감**: `blocks.md`(양쪽 vertical)를 `for-claude-api/`에서 `for-context/`로 이동(2026-07-16) — 실질 지침이 이미 `schema-summary.md`에 압축돼 있음을 확인, 고위험 블록 예시만 `schema-summary.md`에 압축 이관. boutique-fitness 기준 system 프롬프트 약 44% 절감(34,372→19,019토큰 추정). 캐싱은 현재 트래픽 규모(사장님 1인당 1회성 호출, 동시 접속 거의 없음)에서 효용이 낮다고 판단해 미적용 — 트래픽이 늘면 재검토 필요
- [x] **SKILL.md 일관성 감사**(2026-07-16) — "아무 정보 없는 새 세션이 SKILL.md만 보고 boutique-fitness를 생성해도 맞는 결과가 나오는가"를 기준으로 전체 재검토. 발견한 문제: (1) 작업순서 3~4단계가 general 전용 축A/축B 판단을 모든 vertical에 무조건 적용하듯 서술 — boutique-fitness엔 이 축 자체가 스키마에 없어 실제로 따르면 존재하지 않는 필드를 채우려 시도했을 것, (2) "업종 분류(2개 축)" 섹션 전체가 general 전용인데 공용 파일(SKILL.md)에 무조건적으로 있었음, (3) 블록 목록 표가 general 구조(13개)만 있고 boutique-fitness(15개, `professionals` 등 신규 3종 미반영)는 다루지 않음, (4) 블록 개수를 "최대 11개"로 잘못 고정 서술(실제 general 13개/boutique-fitness 15개), (5) 체크리스트가 general의 필수 블록 번호(0·1·2·4·7·8)를 하드코딩. 조치: general 전용 판단 로직은 `general/schema-summary.md`로 이관하고 SKILL.md는 vertical-중립적 포인터로 교체, 블록 표 삭제 후 각 vertical의 `schema-summary.md`를 유일한 원본으로 참조하도록 통일, 체크리스트를 vertical 조건부로 재작성
- [x] **4개 프로덕션 파일 종합 진단**(2026-07-16) — "이 4개 파일만으로 새 세션이 매번 일관되게 고품질 JSON을 낼 수 있는가"를 스키마 대조로 검증. 필드·enum 커버리지는 문제 없음(프로그램으로 전수 대조). 발견한 실제 버그: **boutique-fitness의 `schema-summary.md`가 `menu`(mode별 items/categories 상호배타, item_consult→price null)와 `hours`(24h↔structured 상호배타) 조건부 규칙을 텍스트로 전혀 표현하지 않고 있었음** — general의 `schema-summary.md`는 이미 이 규칙들을 명시하고 있었는데(과거 "hours if/then 비대칭 버그"를 겪은 이력이 있어 그때 고쳐진 것으로 추정), boutique-fitness 버전을 손으로 새로 쓰면서 그 패턴을 빠뜨렸음 — general 대비 boutique-fitness가 파생 관계 없이 별도 작성돼 생긴 전형적인 수동 동기화 누락. general 패턴을 그대로 가져와 수정. 추가로 SKILL.md에 "출력은 순수 JSON 객체 하나, 마크다운 코드펜스·설명 문장 금지" 지시가 전혀 없던 것도 발견해 추가(백엔드가 `JSON.parse()`로 직접 파싱하므로 이게 없으면 파싱 실패 위험). 후속으로 min/maxItems 개수 제약까지 전수 재점검(1차 감사에서 놓쳤던 범주) — general `reviews`가 실제 스키마(최소 1개)와 다르게 "2~4개"로 잘못 서술된 것, boutique-fitness `transformations`에 권장 개수(1~4개) 언급이 아예 빠진 것 2건 추가 발견·수정. 픽스처 재검증 통과 확인.
- [x] **카피 품질 진단**(2026-07-16) — "매번 새 세션이 일관되게 고품질 카피를 낼 수 있는가"를 점검. **핵심 발견: boutique-fitness의 톤 개념("차분한 확신")이 API 전송 파일 어디에도 없었음** — `for-context/definition.md`·`for-frontend/design-guide.md`에만 존재(둘 다 API 미전송). `copywriting.md`의 일반 원칙(최상급 금지 등)은 노골적 과장은 막지만, "사실이어도 텐션이 과도한 문체"(예: 느낌표 많은 감탄형 카피)까지는 못 걸러냄. 특히 개별 규칙이 없는 필드(`atmosphere`·`philosophy`·FAQ 답변)는 세션마다 톤이 들쭉날쭉할 위험이 있었음. `boutique-fitness/schema-summary.md` 상단에 "이 vertical의 카피 톤" 절을 신설해 명시적 원칙 + 대조 예시로 보강, "개별 규칙 없는 필드에도 적용된다"고 명시. general도 비교 확인 결과 완화된 형태로 같은 위험이 있어(`axis_a_tone` 설명은 있으나 "모든 필드에 일관 적용"이라는 명시가 없었음) 동일하게 보강 문장 추가.
- [x] **Claude Code 발견 버그 수정**(2026-07-16) — `boutique-fitness/schema-summary.md`의 `cta_interaction_mode` 필드에 `functional`/`guided` 정의가 없어서, `for-claude-api/{vertical}/` 폴더가 "통째로 API에 보내도 안전"해야 한다는 원칙(1장)을 위반하고 있었음(Claude Code가 실제 프롬프트 조립 중 발견). 근본 조치: 정의 자체는 vertical 무관 공통 개념이라 `copywriting.md` 7장으로 이관하고, 각 vertical의 `schema-summary.md`는 "왜 이 vertical이 이 기본값을 쓰는지"만 남기도록 재작성(general·boutique-fitness 둘 다 수정) — `blocks.md`를 뺐을 때와 같은 실수(같은 개념을 vertical마다 복붙)가 여기서도 재발할 뻔한 것을 공통 파일로 이관해 원천 차단
- [x] **CTA 구조 재설계 — 단일 채널 강제에서 다이얼로그 방식으로 전환**(2026-07-17) — 상단바·히어로·하단CTA바가 채널 하나(`cta_primary_action`/`cta_interaction_mode`)로 직결되던 구조를 폐기. 대신 `meta.inquiry_channels`(예약·문의: 전화·네이버예약·카카오톡·인스타DM·기타, 복수 선택)와 `meta.browse_channels`(둘러보기: 카카오톡·네이버블로그·인스타그램·유튜브·네이버지도·기타, 복수 선택) 두 배열을 신설 — 사장님이 입력 폼에서 이미 확정해 전달(스킬은 판단 없이 pass-through, `brand_color`와 동일 패턴). 상단바·히어로·하단CTA바는 `cta_label`(문구만)로 단순화되고, 클릭 시 `inquiry_channels`를 나열한 다이얼로그가 열림 — 방문자가 원하는 채널을 직접 고를 수 있어 "하나만 강제 선택"하던 문제가 해소됨. `browse_channels`는 히어로에 버튼 행으로 별도 노출. `sticky_cta`도 "메인+보조 2버튼"에서 단일 버튼으로 단순화(둘러보기가 히어로에 이미 있어 하단바에서 반복 불필요). `cta_interaction_mode`(functional/guided) 개념은 boutique-fitness에서 완전히 제거 — `copywriting.md` 7장엔 general용으로 남기고 boutique-fitness는 미사용 명시. `content.schema.json`(신규 `InquiryChannel`/`BrowseChannel` if/then 조건부 포함)·`content.types.ts`·`schema-summary.md`·`for-context/blocks.md`(구버전 표시)·`input-questions.md`(복수선택 질문 재작성)·`design-guide.md`(신규 `inquiry-dialog`·`channel-button` 컴포넌트) 전부 갱신, fixture(`pilates-jieum.json`) 정상·비정상 케이스 재검증 통과
- [ ] `evals/boutique-fitness-evals.json` 신설 (부티크 피트니스 전용 테스트 케이스, general의 `evals.json`과 분리할지 같은 파일에 vertical 필드로 구분할지는 미정)
- [ ] 백엔드의 `build-skill-prompt.ts`가 vertical별로 프롬프트(현재 general/boutique-fitness 2종, 향후 vertical 추가 시 확장)를 만들도록 재작성
- [x] **DB 아키텍처 확정**(2026-07-17, cornerpage 저장소 쪽 검토 결과 반영) — `sites` 테이블 단일 유지(콘텐츠 테이블 vertical별 분리 계획은 재검토 후 철회, 근거는 6장 참고) + `content_json jsonb` + 신설 `vertical text not null default 'general' check (vertical in (...))` 컬럼. Storage 버킷도 vertical별 미분리(경로가 이미 `{site_id}/{slot}.ext`로 격리돼 있어 실익 없음). 블록 단위 분리는 실제 기능 필요 시점까지 보류.
- [ ] `generate-content.ts`가 vertical에 따라 다른 ajv 스키마 인스턴스를 골라 검증하도록 수정
- [x] `for-frontend/fixtures/` vertical별 분리 완료(2026-07-16) — `general/`(5종)·`boutique-fitness/`(1종: 지음필라테스, ajv 검증 통과). `gym-thorgym.json`은 완전히 폐기(신규 스키마 미반영 + 라우팅상 boutique-fitness 업종인데 general 폴더에 있던 오류) — `pilates-jieum.json`이 대체
