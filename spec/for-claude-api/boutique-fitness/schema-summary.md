# 콘텐츠 JSON 구조 정의 (프롬프트 주입용, 이 vertical의 유일한 구조 문서)

> **이 파일의 용도**: Structured Outputs가 `content.schema.json`의 규모와 `if/then` 조건부 분기를 실측 테스트에서 처리하지 못해(2026-07 확인, 근거는 [백엔드 API 아키텍처] 문서 6장) 포기했다. 대신 이 파일을 시스템 프롬프트에 텍스트로 포함시켜 Claude가 스스로 구조를 지키도록 유도하고, 최종 강제는 API 레이어의 ajv 런타임 검증(`content.schema.json`)이 담당한다. 이 파일이 이 vertical의 구조에 대한 **유일한 원본**이다 — 다른 곳에 복사해두지 않는다.
>
> **general과의 구조적 차이**(배경 논리는 `../../for-context/boutique-fitness/definition.md`, 블록별 상세 근거는 `blocks.md` 참고):
> - `axis_a_tone`·`axis_b_layout` 없음 — 이 vertical은 톤·레이아웃·블록 순서가 고정. 대신 `meta.lead_emphasis`로 증거 클러스터 순서만 조정.
> - `about` 블록 없음 — `professionals`가 그 역할을 흡수.
> - 신규 블록 3개: `transformations`(비포/애프터) · `professionals`(전문가 프로필, **이 vertical의 필수 블록**) · `facility`(시설 스펙).
> - `reviews.items`에 `trainer_tag` 필드 추가.
> - 블록 순서 자체가 general과 다름(아래 목차가 실제 페이지 순서).

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
    "cta_primary_action": "reservation | call | direction",
    "cta_interaction_mode": "functional | guided (이 vertical은 guided가 기본값)",
    "logo_url": "url | null", "brand_color": null
  }
}
```

## 3. blocks (페이지 등장 순서)

### 0. topbar (필수)
```json
"topbar": {
  "display_name": "string, required",
  "action_button": { "type": "call | reservation | direction | dm", "label": "string (저부담 문구만: '무료상담 신청' 등. '지금 등록' 류 금지)" }
}
```
내비게이션 메뉴 없음. `type` 기본값 `reservation`.

### 1. hero (필수)
```json
"hero": {
  "badge": "string, required (지역 + 구체적 전문분야, 예: '수내동 · 필라테스 스튜디오')",
  "headline": "string, required (정체성·전문성 사실 기반. 결과 약속 문구 금지 — 증거는 뒤 블록이 담당)",
  "tagline": "string, required ('나도 할 수 있을까' 불안을 사실 기반으로 완화하는 자리)",
  "background_image_url": "url | null",
  "cta": { "type": "call | reservation | direction | dm", "label": "string (저부담)" }
}
```

### 2. trust_strip (필수)
```json
"trust_strip": {
  "items": [ { "value": "string", "label": "string" } ]
}
```
정확히 3개. 사람·성과 지표 우선(경력 연차·누적 변화 수·자격증 수). 시설 지표(평수·운영시간 등)는 여기 넣지 않고 `facility`로.

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
4개 필드(before/after/duration/result) 전부 필수 — 하나라도 없으면 그 항목 자체를 만들지 않는다. 결과 수치·기간 없는 사진만으로는 이 블록을 켜지 않는다. **사실 조작 리스크가 가장 큰 블록 — 사장님이 준 데이터만.**

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

### 4. atmosphere (선택)
```json
"atmosphere": {
  "text": "string"
} | null
```
감각적 디테일 위주(공간·소리·조용함 등). 갤러리 인접 배치.

### 4-1. gallery (선택)
```json
"gallery": {
  "images": ["url"],
  "more_link_url": "url | null"
} | null
```
1~4장(general의 4~8장보다 하향). `professionals`·`facility`·`transformations` 사진과 중복 배치 금지 — 순수 분위기 사진만.

### 4-2. facility (선택)
```json
"facility": {
  "size_pyeong": "number | null",
  "has_shower": "boolean | null",
  "has_locker": "boolean | null",
  "has_parking": "boolean | null",
  "equipment_list": ["string"] | null,
  "photos": ["url"] | null
} | null
```
`equipment_list`는 구체적 수량과 함께(예: "리포머 5대"). `photos`는 갤러리와 중복 금지.

### 5. menu (필수)
```json
"menu": {
  "label": "string, required ('메뉴' 대신 업종 언어로: 'PT 프로그램' | '수업 구성' | '클래스 안내')",
  "mode": "item_price | item_consult | package_table (이 vertical은 item_consult가 강한 기본값)",
  "items": [ { "name": "string, required", "price": "string | null", "description": "string | null", "image_url": "url | null", "badge": "string | null" } ],
  "categories": [ { "category_name": "string", "tiers": [ { "label": "string", "price": "string" } ], "representative_tier_index": "integer" } ],
  "full_list_link_enabled": "boolean"
}
```
`item_price`(고정가 노출)는 원칙적으로 쓰지 않는다. `package_table`은 코치 등급제처럼 구조가 명확할 때만.

### 6. info (필수)
```json
"info": {
  "address": "string, required",
  "map_coordinates": { "lat": "number", "lng": "number" },
  "hours": { "type": "24h | structured", "structured": [ { "day": "mon|tue|wed|thu|fri|sat|sun", "open": "HH:mm|null", "close": "HH:mm|null", "break": ["HH:mm","HH:mm"]|null, "last_order": "HH:mm|null", "closed": "boolean" } ] },
  "phone": "string, required",
  "external_links": [ { "platform": "instagram|kakao|naver_reservation|blog", "url": "string" } ],
  "business_info": { "registered_name": "string", "ceo_name": "string", "registration_number": "string" } | null
}
```
예약제 운영이면 "영업시간"을 "상담·수업 가능 시간대"로 이해. 카카오·인스타 DM 있으면 `external_links`에 반드시 포함.

### 7. sticky_cta (필수)
```json
"sticky_cta": {
  "buttons": [ { "type": "call | reservation | direction | dm", "label": "string (작고 되돌릴 수 있게)", "action_value": "string" } ]
}
```
최대 2개. 메인은 상담 창구(`guided`), 보조는 더 낮은 부담의 선택지. 압박형 문구 금지 — 페이지 끝까지 신뢰를 지킨다.

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

