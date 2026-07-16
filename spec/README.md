# cornerpage-dev-package

> ⚠️ **이 폴더(그리고 저장소에 편입된 뒤의 `spec/`)는 참고 문서가 아니라 빌드 의존성입니다.** `scripts/build-skill-prompt.ts`가 빌드 시점에 `skill/` 안의 파일들을 vertical별로 읽어 `skill-prompt.generated.ts`를 만들고, `generate-content.ts`가 `schema/{vertical}/content.schema.json`을 런타임에 직접 import해서 ajv 검증에 씁니다. **이 폴더를 지우거나 옮기면 빌드가 깨집니다.** "그냥 문서니까 정리해도 되겠지"라고 판단하지 마세요.

코너페이지 프로젝트의 개발 참고 자료 통합 패키지. 예전엔 "핸드오프 패키지"(디자인)와 "스킬"(콘텐츠 생성)이 별도 zip으로 관리됐는데, 관리 부담을 줄이기 위해 하나로 합쳤습니다. 다만 **내부 폴더 경계는 여전히 엄격합니다** — 이유는 아래 1장 참고.

## 0. 이 문서부터 읽으세요

Claude Code 세션이든, 사람이든, 이 프로젝트에 새로 합류하면 이 README를 먼저 읽고 시작합니다.

## 1. 폴더 구조와 경계 (가장 중요)

```
cornerpage-dev-package/
├── schema/              콘텐츠 계약 — skill과 design 둘 다 참조하는 단일 소스.
│   │                      단, 업종별로 콘텐츠 구조가 완전히 다르므로 vertical별로 분리되어 있다.
│   ├── general/
│   │   ├── content.schema.json
│   │   └── content.types.ts
│   └── boutique-fitness/
│       ├── content.schema.json
│       └── content.types.ts
├── skill/                1단계: LLM 콘텐츠 생성. 이 폴더 안 내용 중 일부가
│   │                      실제 Claude API 호출 시 시스템 프롬프트로 들어감(방법B)
│   ├── SKILL.md
│   ├── references/
│   │   ├── copywriting.md                 (모든 vertical 공통 — 블록 구조와 무관한
│   │   │                                    순수 카피 작성 원칙이라 유일하게 안 갈라짐)
│   │   └── verticals/
│   │       ├── general/                    ("업종 무관"도 vertical 목록의 기본값 항목
│   │       │                                 하나로 취급 — 매칭되는 vertical이 없을 때 씀)
│   │       │   ├── blocks.md
│   │       │   ├── schema.md
│   │       │   ├── prompt-schema-summary.md
│   │       │   ├── input-questions.md
│   │       │   └── industry-data.md
│   │       └── boutique-fitness/           (PT·필라테스·요가 등 소수정예 지도형, 작성 중)
│   │           ├── blocks.md
│   │           ├── schema.md
│   │           ├── prompt-schema-summary.md
│   │           ├── input-questions.md      (TODO 상태)
│   │           └── industry-data.md        (TODO 상태)
│   └── evals/
│       └── evals.json
└── design/               2단계: 디자인 템플릿(렌더러) 개발. LLM 호출과 완전 무관
    ├── design-guide.md
    └── fixtures/         검증된 콘텐츠 JSON 6종(렌더링 테스트용)
```

**왜 `schema/`가 최상위로 분리되어 있는가**: `content.schema.json`은 두 곳에서 쓰입니다 — (1) 백엔드가 Claude 응답을 ajv로 검증할 때, (2) 렌더러가 TypeScript 타입으로 props를 받을 때. 스킬 실행 시점(시스템 프롬프트)에는 이 파일이 **들어가지 않습니다**(아래 2장 참고). `skill/`과 `design/` 양쪽에 복사본을 각각 두면 스키마를 고칠 때마다 두 곳을 동기화해야 하는데, 실제로 이걸 깜빡해서 버그가 난 적이 있어서(hours 필드 if/then 버그) 최상위 단일 소스로 통합했습니다. **스키마를 고칠 땐 이 폴더의 파일만 고치면 됩니다.**

**왜 `schema/`도 vertical별로 갈라지는가**: 처음엔 모든 업종이 공유하는 단일 스키마(공용 13블록)였지만, DB를 "업종별 테이블 + 블록 단위 JSONB 컬럼" 구조로 가기로 하면서(공통 `sites` 테이블 + 업종별 콘텐츠 테이블) 전제가 바뀌었습니다. 업종별로 콘텐츠·디자인이 완전히 달라질 걸 전제하는 이상, 스키마도 업종별로 달라야 정합적입니다 — 예: boutique-fitness는 general에 없는 트레이너 프로필·자격증 배지 같은 블록이 필요할 수 있습니다. **스키마가 갈라지므로, 그 스키마를 사람이 읽는 문서(`schema.md`)와 축약본(`prompt-schema-summary.md`), 블록 작성 원칙(`blocks.md`)도 전부 vertical별로 갈라집니다.** 유일하게 갈라지지 않는 건 `copywriting.md`뿐입니다 — 이건 "어떤 블록이 있는가"가 아니라 "카피를 어떻게 쓰는가"에 대한 문서라 블록 구조 변경과 무관하기 때문입니다.

**왜 `skill/`과 `design/`을 절대 섞으면 안 되는가**: `SKILL.md`가 지정한 파일들만 매 콘텐츠 생성 요청마다 Claude API 시스템 프롬프트로 실려 토큰 비용이 발생합니다. 디자인 문서(CSS·hex값 등)가 실수로 이 안에 섞이면 (1) 콘텐츠 생성과 무관한 내용에 비용이 새고, (2) 매 파일마다 "이거 프롬프트에 실리나?"를 확인해야 하는 인지 부담이 생깁니다.

## 2. Claude API 호출 시 실제로 무엇이 전송되는가

`skill/`을 실제 Claude API로 호출할 때(방법B, 상세는 별도 "백엔드 API 아키텍처" 문서), 시스템 프롬프트에 결합되는 파일은 정확히 이 5개입니다. 백엔드가 요청 전에 vertical을 먼저 판별해, 그 vertical 폴더 하위의 3개 파일을 골라 넣습니다:

```
skill/SKILL.md
skill/references/copywriting.md                                    (공통, vertical 무관)
skill/references/verticals/{vertical}/blocks.md
skill/references/verticals/{vertical}/prompt-schema-summary.md
skill/references/verticals/{vertical}/industry-data.md
```

`input-questions.md`는 실행 시점에 불필요(이미 폼 응답이 수집된 상태로 들어오므로)해서 제외되고, `schema.md`·`content.schema.json`도 제외됩니다(구조 지시는 축약본인 `prompt-schema-summary.md`가 대신하고, 원본 JSON Schema는 사후 검증에만 씀). `design/` 폴더는 이 흐름에 전혀 등장하지 않습니다.

## 3. 업종(vertical) 라우팅

`SKILL.md` 1단계에 라우팅 규칙이 있습니다. `references/verticals/` 하위에 등록된 vertical 목록(현재 `boutique-fitness`, `general`) 중 사업 정보와 매칭되는 것을 고릅니다. **`general`은 "업종 무관 예외 처리"가 아니라, 매칭되는 전문 vertical이 없을 때 쓰는 vertical 목록의 기본값 항목**입니다 — 구조적으로 다른 vertical과 동등하게 취급합니다. 장기적으로는 이 vertical 목록만으로 라우팅하고, 업종별 전문 vertical이 늘어날수록 `general`이 커버하는 범위는 줄어드는 방향입니다.

실제 백엔드에서는 이 라우팅을 LLM이 실행 중에 고르는 게 아니라, **백엔드 코드가 요청 전에 미리 결정**해서 그에 맞는 시스템 프롬프트(vertical마다 하나씩)를 골라 보내야 합니다(방법B 특성상). vertical이 늘어날수록 백엔드가 관리할 시스템 프롬프트 종류도 그만큼 늘어난다는 뜻입니다.

`verticals/boutique-fitness/`의 `input-questions.md`·`industry-data.md`는 현재 TODO 상태입니다 — 다음 단계에서 채웁니다.

## 4. claude.ai에서 스킬만 테스트하고 싶을 때 (API 비용 없이)

`skill/` 폴더만 압축해서 claude.ai의 스킬 등록 기능에 올리면 됩니다. **`schema/`나 `design/`은 등록하지 않습니다** — 등록하면 Claude가 스킬 탐색 중 디자인 문서를 우연히 읽어 콘텐츠 생성에 섞일 위험이 있고, 애초에 실제 프로덕션(API, 방법B)이 보는 것과 다른 조건에서 테스트하게 되어 테스트 의미가 흐려집니다.

생성된 콘텐츠 JSON이 스키마에 맞는지 확인하고 싶으면, 결과를 개발 세션(Claude와의 대화)에 붙여넣어 해당 vertical의 `schema/{vertical}/content.schema.json`으로 검증받으면 됩니다.

## 5. 소스 오브 트루스 원칙

이 패키지(정확히는 각 파일의 원본)가 정본입니다. Notion은 사람이 읽는 사본이며, 명시적으로 요청받았을 때만 이 패키지 내용을 보고 문서화합니다 — 자동으로 역반영하지 않습니다.

## 6. 저장소(cornerpage repo) 편입 시 주의사항

이 패키지를 `cornerpage` 저장소의 `spec/` 폴더로 편입하고, 기존 저장소 루트의 `skill/`(지금까지 실제로 쓰이던 폴더)은 삭제하는 방식으로 통합합니다.

**삭제 전 필수 절차**: 저장소의 기존 `skill/`과 이 패키지의 `skill/`을 **반드시 diff**해서 차이가 있는지 확인하세요. Claude Code가 그동안 저장소에서 직접 스킬 파일을 수정했을 수 있어(예: 버그 수정 과정에서), 그냥 덮어쓰면 그 변경사항이 조용히 사라질 수 있습니다. 차이가 있으면 삭제하지 말고 먼저 알려주세요.

**경로 변경 필요**: `skill/`이 저장소 루트에서 `spec/skill/`로, `content.schema.json`이 `spec/schema/{vertical}/`로 이동하므로, 이걸 import/read하는 코드의 경로를 전부 갱신해야 합니다:
- `scripts/build-skill-prompt.ts`의 파일 읽기 경로 — 단순 고정 경로가 아니라 **vertical별로 다른 파일을 읽어 시스템 프롬프트를 조립하도록 분기 로직 자체를 새로 작성**해야 합니다(2장의 5개 파일 목록 참고). 기존엔 고정 경로 5개를 읽으면 됐지만, 이제는 vertical 판별 → 그 vertical 폴더의 3개 파일 + 공통 2개 파일을 조합하는 구조입니다.
- `src/lib/generate-content.ts`의 `import contentSchema from "..."` 경로 → vertical에 따라 `spec/schema/{vertical}/content.schema.json` 중 하나를 골라 import(혹은 동적으로 로드)하도록 변경. ajv 검증도 vertical별로 다른 스키마 인스턴스를 써야 합니다.
- `content.types.ts`를 프론트엔드/렌더러 쪽에서 쓰고 있었다면, 그것도 `spec/schema/{vertical}/content.types.ts`를 가리키도록 vertical별로 분기(렌더러도 vertical에 따라 다른 컴포넌트를 그려야 하므로 이 분기는 어차피 필요합니다).
- **DB 스키마도 함께 손볼 필요**: 공통 `sites` 테이블(소유자·slug·도메인·업종카테고리 등) + vertical별 콘텐츠 테이블(예: `general_content`, `boutique_fitness_content`, 각각 블록 단위 jsonb 컬럼)로 분리하기로 확정했습니다. 기존에 단일 `pages` 테이블에 콘텐츠를 통짜 jsonb로 저장하고 있었다면, 이 마이그레이션도 함께 계획해야 합니다.

편입 후 최종 구조:
```
cornerpage/                    (기존 저장소)
├── src/                       (기존 앱 코드)
├── supabase/
└── spec/                      ← 이 패키지가 통째로 여기로
    ├── README.md              (이 문서)
    ├── schema/
    ├── skill/
    └── design/
```

## 7. 다음 단계

- [ ] `verticals/boutique-fitness/00-definition.md` 작성 — "부티크 피트니스에서 좋은 홈페이지란 무엇인가" (신뢰 근거 3유형: 성과/관계/자격)
- [ ] `verticals/boutique-fitness/blocks.md`를 general 복사본에서 실제로 분기 — 이 vertical만의 블록(트레이너 프로필·자격증 배지 등)이 필요한지 판단하고 반영
- [ ] `verticals/boutique-fitness/schema.md`·`prompt-schema-summary.md`·`schema/boutique-fitness/content.schema.json`·`content.types.ts`를 blocks.md 결론에 맞춰 general 복사본에서 분기
- [ ] `verticals/boutique-fitness/input-questions.md` 실제 작성 (트레이너 자격증·PT 프로그램·회원 변화 사례 등 촘촘하게)
- [ ] `verticals/boutique-fitness/industry-data.md` 실제 작성 (강점 후보 세분화, FAQ 세트 확장)
- [ ] `skill/evals/boutique-fitness-evals.json` 신설 (부티크 피트니스 전용 테스트 케이스)
- [ ] 백엔드의 `build-skill-prompt.ts`가 vertical별로 프롬프트(현재 general/boutique-fitness 2종, 향후 vertical 추가 시 확장)를 만들도록 재작성
- [ ] DB: 공통 `sites` 테이블 + vertical별 콘텐츠 테이블(블록 단위 jsonb 컬럼) 마이그레이션 설계 및 적용
- [ ] `generate-content.ts`가 vertical에 따라 다른 ajv 스키마 인스턴스를 골라 검증하도록 수정
