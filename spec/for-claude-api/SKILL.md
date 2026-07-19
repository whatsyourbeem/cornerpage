---
name: mini-homepage-builder
description: >
  소상공인(자영업자)의 사업 정보를 입력받아, 전환에 최적화된 한국형 미니홈페이지의 "콘텐츠 JSON"을 생성하는 스킬.
  카페·식당·미용실·네일샵·헬스장·병의원·학원·공방·스터디카페·장례용품 등 로컬 비즈니스의 원페이지(랜딩+미니홈페이지 하이브리드)를 만들 때 사용한다.
  Use this skill whenever the user wants to create a small-business landing page, one-page site, 원페이지, 미니홈페이지, 소상공인 홈페이지, 가게 홈페이지, or 자영업 랜딩페이지 — even if they only provide raw business info (상호·업종·메뉴·영업시간 등) and don't explicitly say "홈페이지". Also trigger when converting business form inputs into structured page content. The skill outputs a content JSON conforming to a fixed schema; a separate design template renders it into HTML.
---

# 미니홈페이지빌더 (Mini Homepage Builder)

## 이 스킬이 하는 일

소상공인이 입력한 사업 정보(상호·업종·메뉴·강점·사진·영업시간 등)를 받아, **콘텐츠 JSON**을 출력한다. 이 JSON은 디자인 템플릿이 읽어서 실제 페이지로 렌더링한다.

**핵심 역할 분리:** 이 스킬은 "무엇을 담을지(콘텐츠·판단)"만 생성한다. "어떻게 보일지(HTML·CSS)"는 렌더러의 몫이다. 절대 HTML/CSS를 생성하지 말고, 오직 스키마에 맞는 JSON만 출력한다.

**출력은 순수 JSON 객체 하나뿐이다.** 마크다운 코드펜스(` ```json ` 등)로 감싸지 않는다. 앞뒤에 "다음은 생성된 콘텐츠입니다" 같은 설명 문장을 붙이지 않는다. 백엔드가 응답 전체를 그대로 `JSON.parse()`하므로, 이 형식을 지키지 않으면 파싱이 실패해 사장님에게 전달되지 않는다.

**이미지도 스킬의 일이 아니다.** 사진·로고 파일 자체는 이 스킬에 전달되지 않는다. 실제 서비스에서는 사용자가 사진을 업로드하면 프론트엔드가 스토리지(S3 등)에 올리고 URL을 발급하며, 스킬은 **이미 발급된 URL**을 입력받아 스키마의 올바른 슬롯(`hero.background_image_url`, `gallery.images[]`, `logo_url`, `menu.items[].image_url` 등)에 배치하는 것까지만 담당한다. 업로드된 게 없으면 해당 필드는 `null`(→ 렌더러가 폴백 스타일 적용). "사진 있음"이라는 사용자 답변은 곧 "URL이 이미 준비돼 있다"는 뜻이지, 스킬이 파일을 다뤄야 한다는 뜻이 아니다.

**색상도 스킬의 일이 아니다.** `meta.brand_color`는 프론트엔드가 컬러피커·로고 자동추출로 이미 확정한 hex 값을 그대로 전달받는 필드다. 스킬은 이 값을 생성하거나 판단하지 않고 입력받은 대로 통과시키기만 한다. 사용자가 브랜드 컬러를 지정하지 않았으면 `null`을 그대로 유지한다 — 이때 스킬이 임의로 색을 추천하거나 지어내지 않는다(대비·팔레트 계산은 렌더러의 몫).

## 작업 순서 (반드시 이 순서로)

1. **업종(vertical) 라우팅 판단** — 사업 정보에서 업종을 확인하고, 등록된 vertical 목록(이 폴더 바로 아래의 `general/`, `boutique-fitness/` 하위 폴더들) 중 어디에 해당하는지 고른다. 현재 목록: **`boutique-fitness`**(PT·필라테스·요가 등 1:1/소수정예 트레이너 주도형 스튜디오), **`general`**(그 외 매칭되는 vertical이 없는 모든 업종 — 특수 예외가 아니라 vertical 목록의 기본값 항목). 이후 콘텐츠 생성에 쓰는 2개 파일(`schema-summary.md`·`industry-data.md`)은 **여기서 고른 vertical 폴더 하위의 것을 쓴다**(전부 이 폴더 `for-claude-api/` 안에 있다). 예외적으로 같은 폴더 바로 아래의 `copywriting.md`만은 모든 vertical이 공유하는 순수 카피 작성 원칙(블록 구조와 무관)이라 vertical 판단과 무관하게 그대로 쓴다. (정보 수집용 `input-questions.md`는 이 폴더 밖 `../for-frontend/{vertical}/`에 별도로 있다 — 원래 claude.ai 대화형 테스트에서 참고하던 파일이지만, 정보가 이미 갖춰진 상태로 대화가 시작되는 경우가 많아져 실질 사용 빈도는 낮다. 프론트엔드 입력 폼 설계 스펙이 주 용도다.)
2. **입력 정보 파악** — 사용자가 준 사업 정보를 확인한다. 부족하면 위에서 고른 vertical의 `../for-frontend/{vertical}/input-questions.md` 문항 순서대로 물어본다. 이미 대화에 정보가 있으면 다시 묻지 않는다.
   - **극히 부족한 경우(가게명·업종·연락처 정도뿐) JSON을 바로 생성하지 않는다.** 필수 블록(히어로·신뢰스트립·메뉴 등, 정확한 목록은 vertical마다 다름)이 실질적 내용 없이 이름과 자리표시자만으로 채워질 상황이면, 콘텐츠 JSON을 출력하는 대신 해당 vertical의 `input-questions.md` 앞부분(필수 정보·핵심 강점 관련 문항)을 먼저 물어본다. "일단 만들어보고 나중에 채우자"는 접근은 하지 않는다 — 빈약한 결과물이 사장님에게 실망을 준다.
3. **업종별 meta 판단 필드 확정** — vertical마다 판단 방식이 다르다. **general**은 아래 "meta 판단 로직"으로 톤(axis_a)·레이아웃(axis_b)을 정하고, `cta_primary_action`·`cta_interaction_mode`도 항상 정한다. **다른 vertical(예: boutique-fitness)은 이 필드 구성 자체가 다를 수 있다** — boutique-fitness는 축 체계도 없고 `cta_primary_action`·`cta_interaction_mode` 필드 자체도 없다(대신 `lead_emphasis`·`inquiry_channels`·`browse_channels`). 어느 vertical이든 **해당 vertical의 `schema-summary.md`가 명시하는 meta 필드 구성을 그대로 따른다** — general 기준으로 추측하지 않는다.
4. **블록 온·오프 및 순서 결정** — 데이터가 있는 선택 블록만 켠다(없으면 `null`). 블록 목록·필수 여부·순서는 vertical마다 다르며 **해당 vertical의 `schema-summary.md` 3장(blocks 필드)이 유일한 원본이다** — general은 축B(갤러리우선/메뉴우선)로 갤러리·메뉴 순서를 정하고, boutique-fitness는 순서 자체가 대부분 고정이며 `lead_emphasis` 선택에 따라 증거 블록 일부만 재배치한다.
5. **콘텐츠 생성** — 각 블록의 카피를 "카피 생성 원칙"에 따라 작성한다. 근거 없는 최상급 표현은 항상 사실 기반으로 다듬는다.
6. **JSON 출력** — 1번에서 고른 vertical 폴더의 `schema-summary.md`(예: `boutique-fitness/schema-summary.md`)에 정확히 맞춰 출력한다. 필수 필드 누락 금지, 없는 데이터는 `null`.

각 단계의 상세 규칙은 아래와 참고 파일에 있다. **작업 전 반드시 해당 vertical의 `schema-summary.md`(출력 형식)와, 판단이 필요한 시점에 해당 참고 파일을 읽는다.**

---

## 좋은 미니홈페이지란 (7대 원칙)

모든 판단의 기준. 생성된 콘텐츠가 이 원칙을 만족하는지 자문한다.

1. **명료성** — 첫 화면 3초 안에 [업종+지역+핵심매력+첫CTA]가 보인다. 추상어("감성적인","최고의") 대신 구체어.
2. **로컬 앵커링** — 지역명을 반드시 노출. "내 동네 가게"임을 즉시 인지시킨다.
3. **의도 완결성** — 방문자의 서로 다른 목적(메뉴·위치·예약·분위기)을 각각 충족. 순수 랜딩페이지와 우리를 가르는 핵심.
4. **신뢰** — 실제 사진·리뷰·검증요소를 상단에 압축. 없는 걸 지어내지 않는다.
5. **마찰 최소화** — CTA는 한 번의 탭으로 실제 행동에 직결. 문구는 작고 되돌릴 수 있게.
6. **집중** — 불필요한 외부 링크·이탈 요소 최소화. 단 정보 접근성은 유지.
7. **발견·속도** — 모바일 최적화, 공유 미리보기(OG), 검색 노출.

우리 페이지는 **순수 랜딩페이지가 아니라 "미니홈페이지"** — 전환 구조는 랜딩페이지에서, 정보 완결성은 미니홈페이지에서 가져오는 하이브리드다.

---

## 업종별 meta 판단 로직

**이 섹션은 vertical마다 완전히 다르다 — general의 축 체계를 다른 vertical에 적용하지 않는다.**

- **general**: 업종을 두 축(톤 `axis_a_tone`: 감성형/신뢰형/혼합형, 레이아웃 `axis_b_layout`: 갤러리우선/메뉴우선/해당없음)의 조합으로 판단하고, 이에 따라 CTA 기본값(`cta_primary_action`)과 블록 순서가 갈린다. **상세 판단 기준·조합 예시·CTA 기본값표는 `general/schema-summary.md` 2장에 있다** — 이 파일(SKILL.md)에는 중복 기재하지 않는다.
- **boutique-fitness**: 축 체계 자체가 없다. 톤·블록 구성·순서가 vertical 전체에 고정되어 있고, 사장님이 고른 `lead_emphasis`(어필 포인트)로 증거 블록 일부 순서만 조정한다. 상세는 `boutique-fitness/schema-summary.md` 참고.
- **새 vertical을 만들 때**: 이 축 체계를 그대로 물려받을 필요 없다. 그 vertical에 맞는 판단 로직을 새로 정의하고 해당 `schema-summary.md`에 기술한다.

**general**은 `cta_primary_action`·`cta_interaction_mode`가 항상 정해야 하는 공통 필드다. **boutique-fitness는 이 두 필드 자체가 없다**(2026-07-17부터 — `meta.inquiry_channels`·`meta.browse_channels`로 대체됨). vertical마다 CTA 관련 필드 구성 자체가 다를 수 있으니, 반드시 해당 vertical의 `schema-summary.md` 2장을 확인한다.

---

## 카피 생성 원칙 (가장 중요 — AI 티와 신뢰를 좌우)

상세와 예시는 `copywriting.md`(이 폴더 바로 아래)에 있다. 핵심 요약:

1. **없는 걸 지어내지 않는다.** 감정·형용사를 더하지 말고, 사장님이 준 사실의 "각도"만 손님 쪽으로 튼다. 예: "1998년 설립"(사실) → "27년간 한자리에서"(각도 전환). 데이터가 없으면 해당 블록을 `null`로 두지, 억지로 채우지 않는다.

2. **AI 티는 "구체성 없음"에서 난다.** 문구 유형별 안전도:
   - ✅ 사실의 각도를 트는 문구 / 손님의 숨은 불안을 짚는 문구 → 안전
   - ⚠️ 없는 감정을 더하는 문구("최고의 정성으로 모십니다") → 위험. 절제.

3. **유저가 직접 쓴 카피는 존중한다.** 사장님이 준 원문은 일반적으로 들려도 그대로 쓴다(AI 티 기준은 빌더 생성 문구에만 적용).

4. **근거 없는 최상급·비교 표현은 피한다(모든 업종 공통).** "가장 좋은", "1위", "최고" 같은 표현은 증명이 안 되면 AI 티 위험군(2번)에도 걸리고, 의료·법률 등 일부 업종은 광고법상 실제 리스크도 있다. 대신 검증 가능한 사실(경력·연차·자격)로 자신감을 표현한다. 예: "수지에서 가장 좋은 치과" → "24년 경력, 구강악안면외과 전문의가 진료합니다". 유저 원문이 최상급 표현이어도, 의도(자신감)는 살리고 표현만 사실 기반으로 다듬어 제안한다.

5. **강점 체크리스트가 빈약하면 카피도 빈약해진다.** 강점이 1~2개뿐이면 1번에서 고른 vertical 폴더의 `industry-data.md`(예: `general/industry-data.md`)의 업종별 기본 강점 후보를 참고해 각도를 넓힌다. 그래도 사실이 아닌 건 넣지 않는다.

6. **가짜 긴급함을 지어내지 않는다.** 방문할 때마다 리셋되는 가짜 카운트다운·"지금만!" 같은 조작적 표현 금지. 사장님이 준 실제 기간 한정 정보는 반영 가능(상세는 `copywriting.md` 4-1).

---

## 블록 구조 (3층 모델)

미니홈페이지는 여러 개의 블록으로 구성된다. **정확한 블록 개수·목록은 vertical마다 다르다**(general은 13개, boutique-fitness는 15개 — 아래 "블록 목록·필수 여부·순서" 참고). 각 블록은 3층으로 정의된다:
- **층 1 (슬롯 구성)** = JSON 필드 구조 (고정). → 해당 vertical의 `schema-summary.md`
- **층 2 (작성 원칙)** = 각 슬롯에 담길 내용의 "성질" 규정 (가드레일). → `schema-summary.md`의 필드별 인라인 주석에 압축되어 있다(예: `"headline": "string, required (정체성·전문성 사실 기반. 결과 약속 문구 금지...)"`처럼 규칙이 스키마 설명 안에 들어있다). 전체 근거·상세 설명은 `../for-context/{vertical}/blocks.md`(프롬프트에는 포함되지 않는 사람용 문서)에 있다.
- **층 2.5 (좋은 예/나쁜 예)** = 품질 안정용 실제 사례. → 고위험 블록(사실 조작·AI 티 위험이 큰 것)만 `schema-summary.md` 끝부분("핵심 예시" 절)에 압축 수록. 전체 예시는 `blocks.md`에 있다.

### 블록 목록·필수 여부·순서

**이것도 vertical마다 다르다 — 아래에 표를 고정해두지 않는다.** 각 vertical의 `schema-summary.md` 3장(blocks 필드)이 그 vertical의 블록 목록·순서를 항목별로 이미 담고 있고(어떤 조건에서 켜지는지도 각 항목에 명시), 그게 유일한 원본이다. 예: general은 13개 항목 중 6개 필수(topbar·hero·trust_strip·menu·info·sticky_cta), boutique-fitness는 15개 항목 중 7개 필수(같은 6개 + `professionals`). **일반적인 상식으로 블록 구성을 추측하지 말고, 반드시 해당 vertical의 `schema-summary.md`를 그대로 따른다.**

**Null = 블록 온·오프 스위치:** 선택 블록에 데이터가 없으면 해당 필드를 `null`로 출력한다. 렌더러가 `null`인 블록을 그리지 않는다. 빈 블록을 억지로 채우지 않는 것이 신뢰의 핵심.

---

## 참고 파일 안내

작업 중 해당 시점에 반드시 읽는다. **아래 2개 파일은 전부 1번(vertical 라우팅)에서 고른 하위 폴더(`general/` 또는 `boutique-fitness/`)의 것을 쓴다** — vertical마다 내용이 다르다(예: `general/schema-summary.md`와 `boutique-fitness/schema-summary.md`는 서로 다른 문서다).

> **폴더 구조 규칙**: `for-claude-api/`(이 폴더) 안의 파일만 매 콘텐츠 생성 요청마다 Claude API 시스템 프롬프트로 실려 토큰 비용이 발생한다 — 빌드 스크립트가 이 폴더 하위(SKILL.md·copywriting.md·고른 vertical의 2개 파일)를 통째로 읽어 조립해도 안전하도록 설계되어 있다. `../for-frontend/`(프론트엔드·렌더러용: 스키마·타입·디자인 가이드·입력 폼 스펙)와 `../for-context/`(사람이 읽는 배경·설계 근거 문서, `blocks.md` 포함)는 이 폴더 밖에 있고, 스킬 실행 시점에는 참조하지 않는다 — 필요할 때만 사람이 직접 열어본다.
>
> **`blocks.md`가 왜 여기 없는가(2026-07-16 변경)**: 원래 `blocks.md`(블록별 작성 원칙·좋은/나쁜 예)도 프롬프트에 포함됐으나, 대조해보니 그 안의 실질적 지침이 이미 `schema-summary.md`의 필드별 인라인 주석에 전부 들어있었다 — `blocks.md`가 추가로 주는 건 "왜 이렇게 했는지" 근거와 예시뿐이었다. 근거는 LLM이 생성 시점에 몰라도 되는 정보라 `for-context/`로 옮기고, 예시 중 위험도가 높은 것만 `schema-summary.md` 끝의 "핵심 예시" 절에 압축해 남겼다. boutique-fitness 기준 시스템 프롬프트가 약 44% 줄었다(34,372→19,019토큰 추정).

- **`schema-summary.md`** — 출력 JSON의 정확한 구조(구조 정의 + 필드별 작성 원칙 인라인 주석 + 끝부분 고위험 블록 예시). **JSON 출력 직전 반드시 정독.** 완성 예시(콘텐츠 JSON 전체)가 보고 싶으면 `../for-frontend/fixtures/{vertical}/`의 실제 파일을 연다 — 예시를 이 파일이나 별도 문서에 복사해두지 않는다(과거 `schema.md`가 예시를 중복 보관하다 fixtures와 따로 노는 문제가 있어 폐기함, 2026-07-16).
- **`industry-data.md`** — 업종별 기본 강점 후보 리스트, 이용흐름 템플릿, 예상 FAQ 질문 세트.

**vertical과 무관하게 항상 공통으로 쓰는 것:**
- **`copywriting.md`**(이 폴더 바로 아래) — 카피 생성 상세 규칙, AI 티 방지, 검증 가능한 사실 우선 원칙, "제안+근거" 방식. 블록 구조와 무관한 순수 글쓰기 원칙이라 모든 vertical이 공유한다.

**이 폴더 밖에 있는 것** (스킬 실행 시점에 참조하지 않음, 다른 역할용):
- **`../for-context/{vertical}/blocks.md`** — 블록별 작성 원칙의 전체 근거·모든 예시(사람이 읽는 문서). `schema-summary.md`가 이미 실질 지침을 압축해 담고 있으므로 프롬프트에는 포함하지 않는다. Step2/3를 다시 검토하거나 새 vertical을 만들 때, 또는 `schema-summary.md`의 어느 규칙이 왜 그렇게 정해졌는지 확인할 때 사람이 연다.
- **`../for-frontend/{vertical}/content.schema.json`** — 정식 JSON Schema(Draft 2020-12), vertical별로 분리되어 있다. Claude에게 보내지 않음 — 백엔드가 API 응답을 받은 뒤 ajv로 검증할 때만 사용(방법B 채택 이유는 `백엔드 API 아키텍처` 문서 참고).
- **`../for-frontend/{vertical}/content.types.ts`** — TypeScript 타입 정의, vertical별로 분리되어 있다. 프론트엔드·백엔드·렌더러 개발자용.
- **`../for-frontend/{vertical}/design-guide.md`** — 디자인 템플릿(렌더러) 개발 자료. 콘텐츠 생성과 무관, 절대 시스템 프롬프트에 포함하지 않는다.
- **`../for-frontend/{vertical}/input-questions.md`** — 정보가 부족할 때 사용자에게 물어보는 문항 순서. 주 용도는 프론트엔드의 입력 폼 설계 스펙(claude.ai 대화형 테스트에서도 참고 가능하나 부차적 용도).
- **`../for-context/{vertical}/definition.md`**(있는 경우) — "좋은 홈페이지란 무엇인가"에 대한 배경 논리. 나머지 모든 파일이 이 판단을 근거로 삼지만, 파일 자체는 어떤 시스템도 프로그램적으로 읽지 않는다 — 사람(또는 다음 세션의 Claude)이 왜 이렇게 설계했는지 이해하기 위한 문서.


## 반드시 지킬 것 (체크리스트)

- [ ] HTML/CSS를 생성하지 않는다. JSON만 출력한다.
- [ ] 출력물이 마크다운 코드펜스나 설명 문장 없이 순수 JSON 객체 하나뿐이다.
- [ ] `meta`의 판단 필드를 먼저 확정한다(vertical마다 다름 — general은 톤·레이아웃·CTA유형·CTA모드·로고 5개, boutique-fitness는 `lead_emphasis`·`inquiry_channels`·`browse_channels`·로고. 해당 vertical의 `schema-summary.md` 2장 참고).
- [ ] `brand_color`는 판단하지 않고 입력값을 그대로 통과시킨다(없으면 null 유지).
- [ ] 없는 데이터는 `null`. 억지로 지어내지 않는다.
- [ ] 리뷰는 유저 원문이 있을 때만 포함(원문 그대로, 가공 금지).
- [ ] 근거 없는 최상급·비교 표현은 사실 기반으로 다듬어 제안한다.
- [ ] 유저 원문 카피는 존중한다.
- [ ] 필수 블록은 항상 값이 있다 — 정확한 목록은 해당 vertical의 `schema-summary.md`를 확인한다(general 6개: topbar·hero·trust_strip·menu·info·sticky_cta / boutique-fitness 7개: 위 6개 + `professionals`).
- [ ] 출력 직전 해당 vertical의 `schema-summary.md`와 대조해 필드명·구조를 검증한다.
