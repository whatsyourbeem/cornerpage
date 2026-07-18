# 콘텐츠 JSON 구조 정의 (프롬프트 주입용, 이 vertical의 유일한 구조 문서)

> **이 파일의 용도**: Structured Outputs가 `content.schema.json`의 규모(11개 블록·다수 `$defs`)와 `if/then` 조건부 분기를 실측 테스트에서 처리하지 못해(2026-07 확인, 근거는 [백엔드 API 아키텍처] 문서 6장) 포기했다. 대신 이 파일을 시스템 프롬프트에 텍스트로 포함시켜 Claude가 스스로 구조를 지키도록 유도하고, 최종 강제는 API 레이어의 ajv 런타임 검증(`content.schema.json`)이 담당한다.
>
> **이전엔 `schema.md`(완성 예시 포함, 사람이 읽는 문서)와 이 파일(구조 정의만, 프롬프트용)이 따로 있었으나, 완성 예시가 `../../for-frontend/fixtures/general/*.json`과 완전히 중복 저장되는 문제가 있어 `schema.md`를 삭제하고 이 파일로 통합했다(2026-07-16)** — 구조를 사람이 눈으로 확인할 때도 이 파일을 보면 되고, 완성 예시(콘텐츠 JSON 전체)가 필요하면 `../../for-frontend/fixtures/general/`를 직접 연다. 이제 이 파일이 이 vertical의 구조에 대한 **유일한 원본**이다 — 다른 곳에 복사해두지 않는다.

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

**이 vertical(general)만의 업종 판단 로직 — meta 확정의 핵심.** 업종은 단일 카테고리가 아니라 두 축의 조합으로 판단한다(다른 vertical에는 이 축 체계가 없을 수 있다 — 각자의 schema-summary.md 참고).

**축 A — 톤 (`axis_a_tone`)**
- **감성형**: 카페·식당·미용실·네일 등. 감성·충동 기반. 밝고 따뜻한 톤, CTA는 예약·방문, 갤러리 비중 큼.
- **신뢰형**: 장례용품·법률·병의원·긴급수리 등. 긴급·신뢰 기반. 차분·정중한 톤, CTA는 전화, 신뢰 블록 비중 최상, 가격은 상담문의.
- **혼합형**: 헬스장·스튜디오 등 전문성(신뢰)과 동기부여(감성)가 공존. 주 성향 + 보조 성향으로 비중 조합.

**축 B — 레이아웃 (`axis_b_layout`)**
- **갤러리우선**: 네일·미용·타투 등 "결과물 사진"이 곧 설득력. 갤러리를 신뢰스트립 바로 뒤, 메뉴보다 앞에 배치.
- **메뉴우선**: 카페·식당 등 "무엇을 파는지"가 먼저 궁금. 메뉴 → 갤러리 순서.
- **해당없음**: 갤러리 블록이 없거나 부적절한 업종(장례용품 등).

조합 예: 카페=감성형×메뉴우선, 네일=감성형×갤러리우선, 장례용품=신뢰형×해당없음, 헬스장=혼합형×갤러리우선, 스터디카페=신뢰형×갤러리우선.

**CTA 유형(`cta_primary_action`) 기본값**: 감성형→`reservation`, 신뢰형→`call`, 무인·즉시방문형(스터디카페·무인매장)→`direction`.

**CTA 상호작용 모드(`cta_interaction_mode`)**: 정의는 `copywriting.md` 7장 참고(모든 vertical 공통 — 여기 다시 설명하지 않음). general은 업종에 따라 자연스럽게 갈린다 — 신뢰형(전화 중심)은 `functional`, 감성형·혼합형 중 실제 창구가 DM·카톡인 경우는 `guided`.

**`axis_a_tone`은 CTA·헤드라인뿐 아니라 이 페이지의 모든 카피(atmosphere·philosophy·menu 설명·FAQ 답변 포함)에 일관되게 적용한다.** 감성형인데 신뢰스트립만 따뜻하고 나머지 블록이 건조하거나, 신뢰형인데 히어로만 차분하고 나머지가 들뜬 톤이면 안 된다 — 정한 톤 하나로 페이지 전체를 관통시킨다.

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
1~4개(최소 1개면 충분 — 1개뿐이라고 지어내서 채우지 않는다). 없으면 reviews: null. 유저가 원문을 안 줬으면 지어내지 말고 null.

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

## 5. 핵심 예시 (고위험 블록만 압축)

전체 근거·상세 원칙은 `../../for-context/general/blocks.md`(사람이 읽는 문서, 프롬프트에 포함 안 됨) 참고. 여기엔 AI 티·사실 조작 위험이 큰 블록의 예시만 압축해서 남긴다.

- **hero.headline** 좋은 예: "오래된 다방에서 내리는 한 잔"(구체적 장면), "1998년부터 한자리에서"(사실의 각도 전환) / 나쁜 예: "최고의 정성으로 모십니다"(추상적 AI 티), "갑작스러운 순간에도 곁에서 준비하겠습니다"(감정 형용사 승부 — 이런 톤은 헤드라인이 아니라 tagline으로)
- **trust_strip** 좋은 예: "팔로워 10K / 시술사진 100+ / 5인 동시"(리뷰 없어도 구체적 대체 지표) / 나쁜 예: "고객만족도 1위 / 최고품질"(근거 없는 자기주장)
- **menu.items[].description** 좋은 예: "국산 흑임자를 직접 갈아 넣은 라떼"(재료 구체) / 나쁜 예: "정성으로 준비한 최고의 메뉴"(정보 없는 수식)
- **reviews·faq**: 사장님 원문·답변 그대로만 사용, 절대 지어내지 않는다(위 스키마 주석 참고).

