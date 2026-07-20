# 콘텐츠 JSON 구조 정의 (프롬프트 주입용, 이 vertical의 유일한 구조 문서)

> **이 파일의 용도**: Structured Outputs가 `content.schema.json`의 규모와 `if/then` 조건부 분기를 실측 테스트에서 처리하지 못해(2026-07 확인, 근거는 [백엔드 API 아키텍처] 문서 6장) 포기했다. 대신 이 파일을 시스템 프롬프트에 텍스트로 포함시켜 Claude가 스스로 구조를 지키도록 유도하고, 최종 강제는 API 레이어의 ajv 런타임 검증(`content.schema.json`)이 담당한다. 이 파일이 이 vertical의 구조에 대한 **유일한 원본**이다 — 다른 곳에 복사해두지 않는다.
>
> **general과의 구조적 차이**(배경 논리는 `../../for-context/boutique-fitness/definition.md`, 블록별 상세 근거는 `blocks.md` 참고):
> - `axis_a_tone`·`axis_b_layout` 없음 — 이 vertical은 톤·레이아웃·블록 순서가 고정. 대신 `meta.lead_emphasis`로 증거 클러스터 순서만 조정.
> - `about` 블록 없음 — `professionals`가 그 역할을 흡수.
> - `atmosphere` 독립 블록 없음(2026-07-17) — `facility.atmosphere_text`로 흡수됨. general은 여전히 독립 블록.
> - 신규 블록 2개: `transformations`(비포/애프터) · `professionals`(전문가 프로필, **이 vertical의 필수 블록**). `facility`(시설 스펙)도 신규.
> - `reviews.items`에 `trainer_tag` 필드 추가.
> - `info.landmark_distance`(랜드마크 기반 도보 거리, 2026-07-17 신규) — general엔 없음.
> - `info.external_links` 없음(2026-07-17) — `meta.browse_channels`로 통합.
> - 블록 순서 자체가 general과 다름(아래 목차가 실제 페이지 순서).

## 이 vertical의 카피 톤 — "차분한 확신" (모든 블록에 적용, 개별 규칙 없는 필드도 포함)

`copywriting.md`의 일반 원칙(최상급 금지·AI 티 방지·가짜 긴급함 금지)은 노골적인 과장만 막는다. 이 vertical은 거기서 한 단계 더 나아가, **사실이어도 텐션이 과도하게 높은 문체를 피한다.** 근거: 대형 PT 체인 특유의 "빨강+검정, 느낌표 많은 공격적 세일즈" 톤은 이 vertical이 지우려는 강매 불안을 오히려 되살린다(상세는 `definition.md` 7장 반례). 그래서:

- **느낌표·감탄사를 절제한다.** "환상적인 공간에서 시작하세요!" 대신 "큰 창으로 오후 햇살이 들어오는 공간입니다"처럼, 사실을 담담하게 서술한다.
- **증거(수치·사실)가 스스로 말하게 하고, 문장이 대신 흥분하지 않는다.** "체지방률 6%p 감소, 놀랍지 않나요?" 대신 그냥 "체지방률 6%p 감소".
- **이 원칙은 개별 규칙이 없는 필드(`facility.atmosphere_text`·`philosophy`·FAQ 답변 등)에도 똑같이 적용된다** — 아래에 각 블록마다 별도로 "절제하라"고 반복해서 적어두지 않았다고 해서 예외인 게 아니다.
- 목표는 "차분하지만 확신에 찬" 어조다 — 위축되거나 소극적인 것과는 다르다. 자신감은 담되(전문가 경력·구체적 성과), 그걸 표현하는 방식이 절제돼 있다.

---

# 콘텐츠 JSON 스키마 — boutique-fitness

이 스킬의 유일한 출력물은 이 스키마를 따르는 JSON이다. HTML/CSS를 생성하지 않는다.

## 목차
1. 전체 구조
2. meta 필드
3. blocks 필드 (페이지 등장 순서대로: 0~9)
4. Null 처리 규칙 / 필수 블록 목록

---

## 1. 전체 구조

```
{
  "meta":   { ... },
  "blocks": { ... }
}
```

## 2. meta

```json
{
  "meta": {
    "business_name": "string, required",
    "industry_category": "string, required (PT·필라테스·요가 등)",
    "lead_emphasis": "transformations | reviews | professionals | facility | null (사장님이 고른 최우선 어필 포인트, 무응답이면 null → transformations 기본값)",
    "inquiry_channels": [ { "type": "call | naver_reservation | kakao | instagram_dm | other", "action_value": "string(전화번호 또는 URL)", "other_label": "string | null" } ],
    "browse_channels": [ { "type": "kakao | naver_blog | instagram | youtube | naver_map | other", "action_value": "string(URL)", "other_label": "string | null" } ] ,
    "logo_url": "url | null", "brand_color": null
  }
}
```
**`inquiry_channels`·`browse_channels`는 스킬이 판단·생성하지 않는다 — 프론트엔드 입력 폼에서 사장님이 이미 고른 채널이 확정되어 그대로 전달된다(`brand_color`와 동일한 pass-through 패턴).** 스킬의 역할은 이 배열을 손대지 않고 출력 JSON에 그대로 옮겨 담는 것뿐이다.

**조건부 규칙(중요, 놓치면 스키마 검증 실패)**: 각 채널 항목에서 `type`이 `other`일 때만 `other_label`이 문자열이어야 하고, 그 외 모든 type(`call`·`kakao`·`instagram_dm` 등)에서는 `other_label`이 반드시 `null`이어야 한다. 둘 다 채우거나 둘 다 비우면 안 된다.

`inquiry_channels`는 최소 1개(필수). `browse_channels`는 없으면 `null`.

**general과 구조가 다름**: general은 버튼 하나=행동 하나(`cta_primary_action`/`cta_interaction_mode`로 단일 CTA 성격을 지정)지만, 이 vertical은 여러 채널을 한 다이얼로그에 다 보여주는 방식이라 그 두 필드 자체가 없다. 문의 채널이 여러 개여도 방문자가 원하는 채널을 직접 고를 수 있어 "하나만 강제로 골라야 하는" 문제가 없다.

## 3. blocks (페이지 등장 순서)

### 0. topbar (필수)
```json
"topbar": {
  "display_name": "string, required",
  "cta_label": "string, required (저부담 문구만: '무료상담 신청' 등. '지금 등록' 류 금지)"
}
```
내비게이션 메뉴 없음. 클릭하면 `meta.inquiry_channels`를 나열한 다이얼로그가 열린다(프론트엔드가 렌더링 — 스킬은 라벨 문구만 쓰면 됨).

### 1. hero (필수)
```json
"hero": {
  "badge": "string, required (지역 + 구체적 전문분야, 예: '수내동 · 필라테스 스튜디오')",
  "headline": "string, required (정체성·전문성 사실 기반. 결과 약속 문구 금지 — 증거는 뒤 블록이 담당. 줄바꿈은 \\n으로 직접 지정 — 최대 2줄, 각 줄 4~20자. 20자 넘는 문장을 \\n 없이 한 줄로 넣으면 스키마가 거부한다)",
  "tagline": "string, required ('나도 할 수 있을까' 불안을 사실 기반으로 완화하는 자리)",
  "background_images": "url[] | null (최대 5장. 여러 장이면 렌더러가 순서대로 전환하며 줌 애니메이션 적용 — 이미 구현됨, 스킬은 URL 순서만 그대로 전달)",
  "cta_label": "string, required (저부담)"
}
```
**`headline` 줄바꿈 규칙(중요)**: 브라우저가 뷰포트 너비에 따라 임의 위치에서 줄바꿈하는 걸 막기 위해, 줄바꿈 위치를 생성 단계에서 직접 정한다. 20자 이내로 짧으면 `\n` 없이 한 줄로. 그보다 길면 **의미 단위(구·절 경계)**로 끊어서 `\n` 하나만 넣는다 — 조사·어절 중간에서 끊지 않는다.

**좋은 예:** `"8년째 재활 전문으로,\n한 사람만 보는 PT"` — 쉼표(의미 단위) 뒤에서 끊음, 각 줄 20자 이내.
**나쁜 예:** `"8년째 재활 전문으로, 한 사람만 보는 PT"`(27자, `\n` 없음 — 스키마 거부) / `"8년째 재활 전문으로, 한\n사람만 보는 PT"`(어절 중간에서 끊음 — 스키마는 통과해도 의미 단위 원칙 위반).

`meta.browse_channels`가 있으면 히어로에 채널별 버튼이 함께 나열된다(프론트엔드가 `meta`에서 직접 읽어 렌더링 — hero 스키마 자체엔 필드 없음, 스킬이 신경 쓸 부분 아님).

### 2. trust_strip (필수)
```json
"trust_strip": {
  "items": [ { "value": "string", "label": "string", "icon": "Calendar | Clock | Users | Award | BadgeCheck | TrendingUp | RefreshCw | Heart | Star | Dumbbell | MessagesSquare | Trophy" } ]
}
```
정확히 3개. 사람·성과 지표 우선(경력 연차·누적 변화 수·자격증 수). 시설 지표(평수·운영시간 등)는 여기 넣지 않고 `facility`로.

**`icon`은 반드시 위 12개 목록 중에서만 고른다 — 목록에 없는 이름을 지어내거나 비슷한 이름으로 대체하지 않는다.** lucide-react 아이콘 컴포넌트명을 렌더러가 그대로 매핑해서 쓰므로, 목록 밖 값은 렌더링이 깨진다.

**지표 유형별 권장 아이콘**(참고용, 사장님이 준 실제 지표에 맞춰 판단):
- 경력·운영 연차 → `Calendar`(우선) 또는 `Clock`
- 누적 회원 수·변화 사례 수 → `Users`(인원 중심) 또는 `TrendingUp`(변화·성장 중심)
- 보유 자격증·수상 이력 → `Award`(우선) 또는 `Trophy`(대회 입상 등)
- 재등록률·재방문율 → `RefreshCw` 또는 `Heart`
- 수업·세션 횟수 → `Dumbbell` 또는 `Repeat` 성격이면 `RefreshCw`
- 상담 건수 → `MessagesSquare`
- 평점·만족도 → `Star`
- 인증·신뢰 지표 일반(위에 안 맞을 때) → `BadgeCheck`

**좋은 예:** `{ "value": "8년", "label": "지도 경력", "icon": "Calendar" }` / `{ "value": "127명", "label": "누적 변화 사례", "icon": "TrendingUp" }` / `{ "value": "4개", "label": "보유 자격증", "icon": "Award" }`
**나쁜 예:** `"icon": "Fitness"` — 목록에 없는 이름을 지어냄(존재하지 않는 lucide 아이콘일 가능성 높음).

### 3. transformations (선택, 사실상 필수급)
```json
"transformations": {
  "items": [
    {
      "before_image_url": "url, required",
      "after_image_url": "url, required",
      "duration_label": "string, required (예: '12주')",
      "result_highlight": "string, required (예: '-8kg')",
      "member_label": "string (익명 처리, 예: '김○영님')",
      "trainer_tag": "string | null (원문에 이름이 있을 때만 — 추론 금지)"
    }
  ]
} | null
```
4개 필드(before/after/duration/result) 전부 필수 — 하나라도 없으면 그 항목 자체를 만들지 않는다. 결과 수치·기간 없는 사진만으로는 이 블록을 켜지 않는다. **사실 조작 리스크가 가장 큰 블록 — 사장님이 준 데이터만.** 권장 개수 1~4개(리뷰·갤러리처럼 채워야 할 목표 개수가 아니라, 사장님이 준 만큼만 — 하나도 없으면 `null`).

### 3-1. reviews (선택, 사실상 필수급)
```json
"reviews": {
  "items": [
    {
      "body": "string, required (원문 그대로, 가공 금지)",
      "rating": "number | null",
      "author": "string (익명 처리)",
      "source": "string | null",
      "trainer_tag": "string | null (원문에 이름이 있을 때만 — 추론 금지)"
    }
  ]
} | null
```
1~4개. 다각도(효과·전문성·시설 등 겹치지 않는 관점) 우선 배치.

### 3-2. professionals (필수 — 이 vertical에서만)
```json
"professionals": {
  "section_label": "string, required (예: '트레이너 소개', '강사진 소개', '요가 지도자 소개')",
  "items": [
    {
      "name": "string, required",
      "title": "string, required",
      "photo_url": "url | null",
      "certifications": ["string"],
      "specialty": "string, required",
      "years_experience": "number | null",
      "bio_quote": "string, required (과장 없이, 전문성 전달 목적)"
    }
  ]
}
```
최소 1개. 자격증 없으면 빈 배열(지어내지 않음) — `years_experience`·`specialty`로 대체.

### 3-3. philosophy (선택)
```json
"philosophy": {
  "text": "string"
} | null
```
**general과 위치가 다름** — hero 직후가 아니라 여기(증거 클러스터 뒤). 스튜디오 차원의 창립 계기로 한정(개인 지도 철학은 `professionals.bio_quote`).

### 4. gallery (선택)
```json
"gallery": {
  "images": ["url"],
  "more_link_url": "url | null"
} | null
```
1~4장(general의 4~8장보다 하향). `professionals`·`facility`·`transformations` 사진과 중복 배치 금지 — 순수 분위기 사진만.

### 4-1. facility (선택)
```json
"facility": {
  "size_pyeong": "number | null",
  "has_shower": "boolean | null",
  "has_locker": "boolean | null",
  "has_parking": "boolean | null",
  "equipment_list": ["string"] | null,
  "photos": ["url"] | null,
  "atmosphere_text": "string | null (감각적 디테일 위주 — 공간·소리·조용함 등)"
} | null
```
`equipment_list`는 구체적 수량과 함께(예: "리포머 5대"). `photos`는 갤러리와 중복 금지.

**`atmosphere_text`는 옛 `atmosphere` 독립 블록을 흡수한 필드다(2026-07-17)** — `facility`와 항상 같은 "공간 클러스터"로 붙어 다니고 독립적으로 위치가 바뀔 일이 없어, 별도 top-level 블록으로 둘 이유가 없어졌다(general은 여전히 독립 블록 유지 — 이 vertical만의 변경). 감각적 디테일(채광·소리·조용함 등)을 담되, 과장 없이(이 vertical의 "차분한 확신" 톤 원칙 적용).

**좋은 예:** `"atmosphere_text": "큰 창으로 오후 햇살이 들어오는 리포머룸, 은은한 음악, 1:1 수업이라 다른 회원 눈치 볼 일이 없는 조용함."`
**나쁜 예:** `"atmosphere_text": "환상적인 공간에서 시작하세요!"` — 느낌표·과장, "차분한 확신" 톤 위반.

### 5. menu (필수, mode에 따라 구조 분기)
```json
"menu": {
  "label": "string, required ('메뉴' 대신 업종 언어로: 'PT 프로그램' | '수업 구성' | '클래스 안내')",
  "mode": "item_price | item_consult | package_table (이 vertical은 item_consult가 강한 기본값)",

  // mode == item_price | item_consult:
  "items": [ { "name": "string, required", "price": "string | null (item_consult면 항상 null → '상담 문의' 렌더)", "description": "string | null", "image_url": "url | null", "badge": "string | null" } ],
  // 대표 1~3개만. 하한 강제 금지(있는 만큼만, 최소 1개). 1개뿐이면 full_list_link_enabled: false.

  // mode == package_table (코치 등급제 등 계층 요금제):
  "categories": [ { "category_name": "string", "tiers": [ { "label": "string", "price": "string" } ], "representative_tier_index": "integer" } ],

  "full_list_link_enabled": "boolean"
}
```
**mode가 package_table이면 `items`는 반드시 null, `item_price`·`item_consult`면 `categories`는 반드시 null(상호 배타 — 둘 다 채우거나 둘 다 비우면 스키마 검증 실패).** `item_price`(고정가 노출)는 원칙적으로 쓰지 않는다. `package_table`은 코치 등급제처럼 구조가 명확할 때만.

### 6. info (필수)
```json
"info": {
  "address": "string, required",
  "map_coordinates": { "lat": "number", "lng": "number" },
  "hours": {
    "type": "24h | structured",
    "structured": "type이 24h면 반드시 null. type이 structured면 반드시 비어있지 않은 배열(최소 1개 요일)이어야 함 — 둘 다 아닌 조합(예: type=structured인데 structured=null)은 렌더러 크래시를 유발하므로 절대 금지:",
    "structured_array_shape": [
      { "day": "mon|tue|wed|thu|fri|sat|sun", "open": "HH:mm", "close": "HH:mm",
        "break": ["HH:mm","HH:mm"], "last_order": "HH:mm", "closed": "boolean" }
    ]
  },
  "phone": "string, required",
  "business_info": { "registered_name": "string", "ceo_name": "string", "registration_number": "string" } | null,
  "landmark_distance": "string | null (지하철역에 한정하지 않는 랜드마크 기반 도보 거리, 예: '시청 사거리에서 도보 5분')"
}
```
예약제 운영이면 "영업시간"을 "상담·수업 가능 시간대"로 이해. **`external_links` 필드는 없다(2026-07-17 제거)** — `meta.browse_channels`와 완전히 중복이었다. 정보 블록 하단 링크는 렌더러가 `meta.browse_channels`를 재사용해서 그린다, 스킬이 신경 쓸 부분 아님.

**`landmark_distance`는 접근성이 핵심 신뢰 요소인 이 vertical에서 특히 중요하다.** 지하철역이 아니어도 괜찮다 — 사장님이 준 실제 랜드마크(사거리·도서관·큰 건물 등) 기준 도보 시간만 있으면 된다. 없으면 `null`(지어내지 않는다).

### 7. sticky_cta (필수)
```json
"sticky_cta": {
  "cta_label": "string, required (작고 되돌릴 수 있게)"
}
```
**general과 달리 버튼 1개로 단순화됨** — 클릭하면 `meta.inquiry_channels` 다이얼로그가 열린다. 둘러보기 채널은 이미 히어로에 노출되므로 여기서 반복하지 않는다. 압박형 문구 금지 — 페이지 끝까지 신뢰를 지킨다.

### 8. how_it_works (선택, 사실상 권장)
```json
"how_it_works": {
  "steps": [ { "order": "integer", "title": "string", "description": "string" } ]
} | null
```
표준 골격: 체험 있으면 **상담→체험→등록(3단계)**, 없으면 **상담→등록(2단계)**. 상담 단계 생략 금지(general의 "무인업종 2단계 압축"은 여기 적용 안 함).

### 9. faq (선택)
```json
"faq": {
  "items": [ { "question": "string", "answer": "string (사실 그대로, 지어내기 금지)" } ]
} | null
```
"초보자도 가능한가요?"는 사실상 필수 후보 질문(히어로 태그라인·전문가 프로필에 이은 3번째 확인 지점).

---

## 4. Null 처리 규칙 / 필수 블록 목록

선택 블록에 값이 없으면 필드 자체가 `null`이며 렌더러는 그 블록을 그리지 않는다. 데이터 없는데 억지로 채우지 않는다.

**필수 블록(항상 값이 있어야 함)**: `topbar · hero · trust_strip · professionals · menu · info · sticky_cta` — general(6개) 대비 `professionals`가 추가되어 7개.

**선택이지만 적극 확보 대상**: `transformations` · `reviews` — `definition.md`의 증거 위계상 직접 증거이므로, 데이터가 있으면 반드시 채운다.

---

## 5. 핵심 예시 (고위험 블록만 압축)

전체 근거·상세 원칙은 `../../for-context/boutique-fitness/blocks.md`(사람이 읽는 문서, 프롬프트에 포함 안 됨) 참고. 여기엔 사실 조작·AI 티 위험이 큰 블록의 예시만 압축해서 남긴다.

- **hero.headline** 좋은 예: "8년째 재활 전문으로,\n한 사람만 보는 PT"(사실 기반, 결과 약속 없음, 의미 단위 줄바꿈) / 나쁜 예: "당신의 몸을 확실히 바꿔드립니다"(증거 없이 결과 선약속 — transformations·reviews의 역할을 가로챔)
- **transformations** 좋은 예: `{ "duration_label": "12주", "result_highlight": "체지방률 6%p 감소" }` / 나쁜 예: `{ "duration_label": null, "result_highlight": "환상적인 변화!" }`(기간·수치 없이 감탄사만 — 이 블록은 절대 지어내지 않는다, 사실 조작 리스크 최고)
- **reviews.trainer_tag / transformations.trainer_tag** 원문에 이름이 실제로 언급된 경우만 채운다. "아마 이 사람이겠지" 식 추론 절대 금지.
- **professionals.certifications** 실제 보유한 것만. 없으면 빈 배열 — 자격증 사칭은 신뢰·법적 리스크로 직결.
- **professionals.bio_quote** 좋은 예: "운동이 처음인 분들이 다치지 않게, 기본기부터 차근차근 봐드립니다."(전문성 전달) / 나쁜 예: "대한민국 최고의 실력으로 인생을 바꿔드립니다"(최상급·과장)

