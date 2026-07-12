# 콘텐츠 JSON 구조 축약본 (프롬프트 주입 전용)

> **이 파일의 용도**: Structured Outputs가 `content.schema.json`의 규모(11개 블록·다수 `$defs`)와 `if/then` 조건부 분기를 실측 테스트에서 처리하지 못해(2026-07 확인, 근거는 [백엔드 API 아키텍처] 문서 6장) 포기했다. 대신 이 축약본을 시스템 프롬프트에 텍스트로 포함시켜 Claude가 스스로 구조를 지키도록 유도하고, 최종 강제는 API 레이어의 ajv 런타임 검증이 담당한다.
>
> **`schema.md`와의 차이**: `schema.md`는 사람이 읽는 완전한 문서로 6개 업종의 완성 예시(JSON 전체)까지 포함해 24,787자다. 이 파일은 완성 예시를 전부 빼고 구조 정의(1~4장)만 남겨 5,719자로 줄였다 — 프롬프트에 매번 실리는 텍스트이므로 토큰 비용에 직접 영향을 준다(4개 파일→5개 파일로 schema.md 전체를 넣었을 때 프롬프트가 84.7% 커졌던 것을 이 축약본으로 대체해 억제한다). **`schema.md` 원본은 계속 사람이 읽는 참고 문서로 유지하고, 이 파일만 프롬프트 주입용으로 별도 관리한다.** `schema.md`가 바뀌면(특히 1~4장) 이 파일도 함께 갱신해야 한다.

---

# 콘텐츠 JSON 스키마

이 스킬의 유일한 출력물은 이 스키마를 따르는 JSON이다. HTML/CSS를 생성하지 않는다.

## 목차
1. 전체 구조
2. meta 필드
3. blocks 필드 (블록 0~10)
4. Null 처리 규칙
5. 완성 예시 6종 (카페·장례용품·네일·헬스장·치과·스터디카페)

---

## 1. 전체 구조

```
{
  "meta":   { ... },   // 페이지 성격 판단 결과
  "blocks": { ... }    // 블록별 콘텐츠 (없으면 null → 렌더러가 블록 생략)
}
```

## 2. meta

```json
{
  "meta": {
    "business_name": "string, required",
    "industry_category": "string, required (카페·장례용품·네일샵·헬스장·치과·스터디카페 등)",
    "axis_a_tone": "감성형 | 신뢰형 | 혼합형",
    "axis_b_layout": "갤러리우선 | 메뉴우선 | 해당없음",
    "cta_primary_action": "reservation | call | direction",
    "cta_interaction_mode": "functional | guided",
    "logo_url": "url | null (없으면 텍스트 로고타입 폴백)", "brand_color": null
  }
}
```

## 3. blocks

### 0. topbar (필수)
```json
"topbar": {
  "display_name": "string, required",
  "action_button": { "type": "call | reservation | direction", "label": "string" }
}
```

### 1. hero (필수)
```json
"hero": {
  "badge": "string, required (지역·업종, 예: '망원동 · 브런치 카페')",
  "headline": "string, required (감정 형용사 금지, 사실 기반)",
  "tagline": "string, required",
  "background_image_url": "url | null (null이면 단색+타이포 폴백)",
  "cta": { "type": "call | reservation | direction", "label": "string" }
}
```

### 2. trust_strip (필수)
```json
"trust_strip": {
  "items": [ { "value": "string (숫자·핵심어)", "label": "string" } ]
}
```
정확히 3개. 없는 항목은 있는 것만(예: 리뷰 없으면 연차·경력으로 대체).

### 3. about (선택)
```json
"about": {
  "body": "string | null (2~3문장, 기본 소개)",
  "signature_quote": "string | null",
  "supporting_image_url": "url | null"
}
```
body가 null이면 블록 전체 생략(about: null로).

### 3-1. philosophy (선택 — about과 독립된 top-level 블록)
```json
"philosophy": {
  "text": "string"
} | null
```
계기·철학 답변이 있을 때만. Manifesto 변형(큰 타이포 강조) 렌더링 대상 — about과 시각적으로 다르게 취급된다.

### 3-2. atmosphere (선택 — about과 독립된 top-level 블록)
```json
"atmosphere": {
  "text": "string"
} | null
```
공간·분위기 답변이 있을 때만. about·philosophy와도 독립적으로 배치 가능(예: 갤러리 인접).

### 4. menu (필수, mode에 따라 구조 분기)
```json
"menu": {
  "label": "string, required (업종 언어로: 대표 메뉴 | 주요 시술 | 과정·수강료 | 이용권 등)",
  "mode": "item_price | item_consult | package_table",

  // mode == item_price | item_consult:
  "items": [
    {
      "name": "string, required",
      "price": "string | null (item_consult면 항상 null → '상담 문의' 렌더)",
      "description": "string | null",
      "image_url": "url | null",
      "badge": "string | null (인기/시그니처, 최대 1~2개 항목에만)"
    }
  ],
  // 대표 1~3개만. 하한 강제 금지(있는 만큼만, 최소 1개). 1개뿐이면 full_list_link_enabled: false.

  // mode == package_table (스터디카페·회원권 등 계층 요금제):
  "categories": [
    {
      "category_name": "string (예: 당일권)",
      "tiers": [ { "label": "string", "price": "string" } ],
      "representative_tier_index": "integer"
    }
  ],

  "full_list_link_enabled": "boolean (true면 '전체보기', 개수 제한 없이 전체 노출)"
}
```
mode가 package_table이면 items는 null, item_*이면 categories는 null (상호 배타).

### 5. gallery (선택)
```json
"gallery": {
  "images": ["url"],           // 4~8장 권장
  "more_link_url": "url | null" // 사진 많으면 인스타 등 외부
}
```
images가 비었으면 gallery: null.

### 6. reviews (선택)
```json
"reviews": {
  "items": [
    {
      "body": "string, required (유저 입력 원문 그대로, 가공 금지)",
      "rating": "number | null",
      "author": "string (익명 처리, 예: '김○영')",
      "source": "string | null (예: '네이버 리뷰')"
    }
  ]
}
```
2~4개. 없으면 reviews: null. 유저가 원문을 안 줬으면 지어내지 말고 null.

### 7. info (필수)
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
  "external_links": [ { "platform": "instagram|kakao|naver_reservation|blog", "url": "string" } ],
  "business_info": { "registered_name": "string", "ceo_name": "string", "registration_number": "string" }
}
```
business_info는 선택(업종 무관). hours.type이 24h면 structured는 null.

### 8. sticky_cta (필수)
```json
"sticky_cta": {
  "buttons": [ { "type": "call | reservation | direction | dm", "label": "string", "action_value": "string (전화번호/URL)" } ]
}
```
최대 2개. 메인 1 + 보조 1.

### 9. how_it_works (선택)
```json
"how_it_works": {
  "steps": [ { "order": "integer", "title": "string", "description": "string" } ]
}
```
2~4단계. 마지막 단계는 주 CTA와 연결. CTA 여러 개면 보조 CTA를 마지막 단계 설명에 분기로 흡수. 없으면 null.

### 10. faq (선택)
```json
"faq": {
  "items": [ { "question": "string", "answer": "string (사장님 입력 사실 그대로, 지어내기 금지)" } ]
}
```
답변된 것만 포함. 없으면 null.

---

## 4. Null 처리 규칙

**선택 블록에 값이 없으면 필드 자체가 `null`이고, 렌더러는 `null`인 블록을 그리지 않는다.** 이것이 "데이터 없는 선택 블록은 자동 생략" 원칙의 구현이다. 데이터가 없는데 억지로 채우면 안 된다(사실 지어내기 금지와 직결). 필수 블록(topbar·hero·trust_strip·menu·info·sticky_cta)은 항상 값이 있어야 한다.

---

