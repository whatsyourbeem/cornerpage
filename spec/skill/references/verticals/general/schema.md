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

## 5. 완성 예시 6종

### 예시 A — 밀물다방 (카페 · 감성형 · 메뉴우선)
```json
{
  "meta": { "business_name": "밀물다방", "industry_category": "카페", "axis_a_tone": "감성형", "axis_b_layout": "메뉴우선", "cta_primary_action": "call", "cta_interaction_mode": "functional", "logo_url": null, "brand_color": null },
  "blocks": {
    "topbar": { "display_name": "밀물다방", "action_button": { "type": "call", "label": "전화하기" } },
    "hero": { "badge": "망원동 · 핸드드립 카페", "headline": "오래된 다방에서 내리는 한 잔", "tagline": "매일 아침 직접 로스팅한 원두로, 자리에 앉으면 천천히 내려드립니다.", "background_image_url": "https://images.unsplash.com/photo-1495474472287", "cta": { "type": "call", "label": "전화하기" } },
    "trust_strip": { "items": [ { "value": "4.8", "label": "네이버 별점" }, { "value": "1,240+", "label": "누적 리뷰" }, { "value": "8년", "label": "한자리 운영" } ] },
    "about": { "body": "1985년부터 이 골목을 지킨 '밀물다방'의 간판과 낡은 나무 문을 그대로 두고, 안쪽만 조용히 고쳤습니다. 원두는 매일 아침 직접 볶습니다.", "signature_quote": "빠른 커피는 많으니까, 여기선 천천히 마시고 가세요.", "supporting_image_url": null },
    "philosophy": { "text": "손님이 아니라 단골이 되어주셨으면 하는 마음으로, 매일 같은 시간에 문을 엽니다." },
    "atmosphere": { "text": "낡은 나무 창틀과 오래된 라디오 소리, 은은하게 배어있는 원두 볶는 냄새 — 손님들이 유독 좋아해주시는 이 공간의 분위기입니다." },
    "menu": { "label": "대표 메뉴", "mode": "item_price", "items": [ { "name": "밀물 핸드드립", "price": "6,500원", "description": "그날 볶은 싱글 오리진", "image_url": null, "badge": "인기" }, { "name": "흑임자 라떼", "price": "6,000원", "description": "국산 흑임자를 직접 갈아 넣은 라떼", "image_url": null, "badge": "시그니처" }, { "name": "쌍화 아메리카노", "price": "5,500원", "description": "겨울 한정 메뉴", "image_url": null, "badge": null } ], "full_list_link_enabled": true },
    "gallery": { "images": ["https://images.unsplash.com/photo-1554118811","https://images.unsplash.com/photo-1442512595331","https://images.unsplash.com/photo-1521017432531","https://images.unsplash.com/photo-1497935586351"], "more_link_url": null },
    "reviews": { "items": [ { "body": "진짜 다방 감성 그대로예요. 사장님이 직접 내려주시는데 기다리는 시간도 좋았어요.", "rating": 5, "author": "김○영", "source": "네이버 리뷰" } ] },
    "info": { "address": "서울 마포구 망원동 골목길 12", "map_coordinates": { "lat": 37.557, "lng": 126.906 }, "hours": { "type": "structured", "structured": [ { "day": "tue", "open": null, "close": null, "break": null, "last_order": null, "closed": true }, { "day": "mon", "open": "11:00", "close": "22:00", "break": null, "last_order": null, "closed": false } ] }, "phone": "02-1234-5678", "external_links": [ { "platform": "instagram", "url": "https://instagram.com/millmuldabang" } ], "business_info": null },
    "sticky_cta": { "buttons": [ { "type": "call", "label": "전화하기", "action_value": "0212345678" }, { "type": "direction", "label": "길찾기", "action_value": "#info" } ] },
    "how_it_works": null,
    "faq": null
  }
}
```

### 예시 B — 삼보토탈 (장례용품 · 신뢰형 · 해당없음 · 사진폴백)
```json
{
  "meta": { "business_name": "삼보토탈", "industry_category": "장례용품", "axis_a_tone": "신뢰형", "axis_b_layout": "해당없음", "cta_primary_action": "call", "cta_interaction_mode": "functional", "logo_url": null, "brand_color": null },
  "blocks": {
    "topbar": { "display_name": "삼보토탈", "action_button": { "type": "call", "label": "24시간 상담" } },
    "hero": { "badge": "부산 금정구 · 장례용품 전문", "headline": "1998년부터 한자리에서, 직접 만들어 온 장례용품", "tagline": "수의·관·상복·위패를 직접 제작해 준비합니다. 갑작스러운 순간에도 언제든 연락 주시면 상담해 드립니다.", "background_image_url": null, "cta": { "type": "call", "label": "24시간 상담 전화" } },
    "trust_strip": { "items": [ { "value": "1998", "label": "설립 연도" }, { "value": "24시간", "label": "상담 가능" }, { "value": "직접", "label": "제작·공급" } ] },
    "about": { "body": "1998년부터 한자리에서, 27년간 이 지역 가족들의 마지막 길을 준비해 왔습니다. 수의부터 관·상복·위패까지 직접 제작해 공급합니다.", "signature_quote": "경황없는 순간일수록, 믿고 맡기실 수 있도록 준비하겠습니다.", "supporting_image_url": null },
    "philosophy": { "text": "장례는 아무리 준비해도 처음 겪는 일처럼 낯설고 힘듭니다. 그 순간 가족들이 다른 걱정 없이 마지막 인사에만 집중하실 수 있도록, 필요한 것들을 미리 세심히 갖춰두는 것이 저희의 일이라 생각합니다." },
    "atmosphere": { "text": "번잡하지 않은 상담 공간에서, 조급함 없이 필요한 절차를 하나씩 짚어드립니다." },
    "menu": { "label": "준비해 드리는 것들", "mode": "item_consult", "items": [ { "name": "수의", "price": null, "description": "전통 수의부터 종교별 수의까지 직접 제작", "image_url": null, "badge": null }, { "name": "관", "price": null, "description": "재질·규격별로 갖춰 상황에 맞게 안내", "image_url": null, "badge": null }, { "name": "상복", "price": null, "description": "가족 상복 일체", "image_url": null, "badge": null } ], "full_list_link_enabled": true },
    "gallery": null,
    "reviews": null,
    "info": { "address": "부산 금정구 공단로49번길 10", "map_coordinates": { "lat": 35.25, "lng": 129.08 }, "hours": { "type": "24h", "structured": null }, "phone": "051-529-0321", "external_links": [], "business_info": null },
    "sticky_cta": { "buttons": [ { "type": "call", "label": "24시간 상담 전화", "action_value": "0515290321" } ] },
    "how_it_works": null,
    "faq": null
  }
}
```

### 예시 C — 네일오브윤 (네일샵 · 감성형 · 갤러리우선 · guided CTA)
```json
{
  "meta": { "business_name": "네일오브윤", "industry_category": "네일샵", "axis_a_tone": "감성형", "axis_b_layout": "갤러리우선", "cta_primary_action": "reservation", "cta_interaction_mode": "guided", "logo_url": null, "brand_color": null },
  "blocks": {
    "topbar": { "display_name": "네일오브윤", "action_button": { "type": "reservation", "label": "예약" } },
    "hero": { "badge": "수지구청역 1분 · 네일샵", "headline": "수지구청역 1분, 5인이 동시에 받는 네일샵", "tagline": "글리터부터 손젤·발젤까지, 기다림 없이 여럿이 함께 받을 수 있어요.", "background_image_url": "https://images.unsplash.com/photo-1604654894610", "cta": { "type": "reservation", "label": "인스타 DM 예약" } },
    "trust_strip": { "items": [ { "value": "10K", "label": "인스타 팔로워" }, { "value": "100+", "label": "시술 사진" }, { "value": "5인", "label": "동시 시술" } ] },
    "about": null,
    "philosophy": { "text": "혼자보다 같이 오는 게 더 즐겁잖아요. 그래서 여럿이 와도 기다리지 않고 나란히 앉아 받을 수 있게 만들었어요." },
    "atmosphere": { "text": "은은한 조명 아래 좋아하는 노래를 틀어두고, 손님들과 편하게 수다 떨면서 작업하는 걸 좋아해요." },
    "menu": { "label": "시술 메뉴", "mode": "item_price", "items": [ { "name": "글리터", "price": "39,000원", "description": null, "image_url": null, "badge": null }, { "name": "손젤", "price": "30,000원", "description": null, "image_url": null, "badge": null }, { "name": "발젤", "price": "40,000원", "description": null, "image_url": null, "badge": null } ], "full_list_link_enabled": true },
    "gallery": { "images": ["https://images.unsplash.com/photo-1610992015732","https://images.unsplash.com/photo-1607779097040","https://images.unsplash.com/photo-1519014816548","https://images.unsplash.com/photo-1632344004429"], "more_link_url": "https://instagram.com/nail_ofyoon" },
    "reviews": null,
    "info": { "address": "경기 용인시 수지구 풍덕천로 116 1층", "map_coordinates": { "lat": 37.33, "lng": 127.10 }, "hours": { "type": "structured", "structured": [ { "day": "mon", "open": "10:30", "close": "19:30", "break": null, "last_order": null, "closed": false } ] }, "phone": "0507-1369-7390", "external_links": [ { "platform": "instagram", "url": "https://instagram.com/nail_ofyoon" } ], "business_info": null },
    "sticky_cta": { "buttons": [ { "type": "dm", "label": "인스타 DM 예약", "action_value": "https://instagram.com/nail_ofyoon" }, { "type": "call", "label": "전화", "action_value": "05071369790" } ] },
    "how_it_works": { "steps": [ { "order": 1, "title": "디자인 전송", "description": "인스타 DM으로 원하는 디자인 사진 전송" }, { "order": 2, "title": "날짜 확정", "description": "희망 날짜 조율 후 확정" }, { "order": 3, "title": "방문 시술", "description": "예약 시간에 방문해 시술" } ] },
    "faq": null
  }
}
```
(축B=갤러리우선 → 렌더 순서에서 gallery가 menu보다 앞. meta로 신호를 주므로 blocks 순서와 무관하게 렌더러가 처리.)

### 예시 D — 토르짐 (헬스장 · 혼합형 · 갤러리우선 · 메뉴 1개)
```json
{
  "meta": { "business_name": "토르짐", "industry_category": "헬스장", "axis_a_tone": "혼합형", "axis_b_layout": "갤러리우선", "cta_primary_action": "reservation", "cta_interaction_mode": "functional", "logo_url": null, "brand_color": null },
  "blocks": {
    "topbar": { "display_name": "토르짐", "action_button": { "type": "reservation", "label": "PT 상담" } },
    "hero": { "badge": "수지구청 · PT 전문 헬스장", "headline": "독보적이고 전문적인 수업. 확실한 결과를 약속드립니다.", "tagline": "경력 20년 이상의 대표 코치가 100평 규모 프라이빗 짐에서 1:1로 지도합니다.", "background_image_url": "https://images.example.com/thorgym-hero.jpg", "cta": { "type": "reservation", "label": "PT 상담 예약" } },
    "trust_strip": { "items": [ { "value": "100평", "label": "규모" }, { "value": "20년+", "label": "대표코치 경력" }, { "value": "도보 1분", "label": "수지구청 4번출구" } ] },
    "about": { "body": "개인 PT 전문 짐으로, 개인 샤워실과 6층 테라스 스카이뷰를 갖췄습니다.", "signature_quote": null, "supporting_image_url": null },
    "philosophy": { "text": "숫자보다 자세가 먼저라고 믿습니다. 부상 없이 오래 운동하실 수 있도록, 기본기부터 차근차근 잡아드립니다." },
    "atmosphere": { "text": "테라스에서 내려다보는 스카이뷰와 프라이빗한 개인 샤워실 — 운동을 마친 후에도 여유를 느끼실 수 있는 공간입니다." },
    "menu": { "label": "PT 프로그램", "mode": "item_consult", "items": [ { "name": "1:1 PT", "price": null, "description": "경력 20년 이상 대표 코치의 맞춤 지도", "image_url": null, "badge": null } ], "full_list_link_enabled": false },
    "gallery": { "images": ["https://images.example.com/thorgym-1.jpg","https://images.example.com/thorgym-2.jpg","https://images.example.com/thorgym-3.jpg"], "more_link_url": "https://instagram.com/thor_gym_" },
    "reviews": null,
    "info": { "address": "경기 용인시 수지구 풍덕천로129번길 7 6층", "map_coordinates": { "lat": 37.32, "lng": 127.10 }, "hours": { "type": "structured", "structured": [ { "day": "mon", "open": "07:00", "close": "23:00", "break": null, "last_order": null, "closed": false }, { "day": "sat", "open": "10:00", "close": "17:00", "break": null, "last_order": null, "closed": false }, { "day": "sun", "open": null, "close": null, "break": null, "last_order": null, "closed": true } ] }, "phone": "0507-1360-7111", "external_links": [ { "platform": "instagram", "url": "https://instagram.com/thor_gym_" }, { "platform": "naver_reservation", "url": "https://naver.me/FK5eF30E" } ], "business_info": null },
    "sticky_cta": { "buttons": [ { "type": "reservation", "label": "PT 상담 예약", "action_value": "https://naver.me/FK5eF30E" }, { "type": "call", "label": "전화 문의", "action_value": "05071360111" } ] },
    "how_it_works": { "steps": [ { "order": 1, "title": "상담 예약", "description": "전화 또는 네이버예약으로 상담·체험 신청" }, { "order": 2, "title": "방문 상담", "description": "시설을 둘러보고 상담" }, { "order": 3, "title": "PT 시작", "description": "체험 먼저 원하시면 체험으로 시작" } ] },
    "faq": null
  }
}
```

### 예시 E — 수지좋은치과 (치과 · 신뢰형)
```json
{
  "meta": { "business_name": "수지좋은치과의원", "industry_category": "치과", "axis_a_tone": "신뢰형", "axis_b_layout": "메뉴우선", "cta_primary_action": "reservation", "cta_interaction_mode": "functional", "logo_url": "https://images.example.com/sujidental-logo.png", "brand_color": null },
  "blocks": {
    "topbar": { "display_name": "수지좋은치과의원", "action_button": { "type": "reservation", "label": "예약" } },
    "hero": { "badge": "수지구 · 치과의원", "headline": "24년 경력, 구강악안면외과 전문의가 진료합니다", "tagline": "세밀하고 정확한 진단으로, 올바른 진료를 위해 노력합니다.", "background_image_url": "https://images.example.com/sujidental-hero.jpg", "cta": { "type": "reservation", "label": "네이버 예약" } },
    "trust_strip": { "items": [ { "value": "전문의", "label": "구강악안면외과" }, { "value": "24년", "label": "임상경력" }, { "value": "외래교수", "label": "연세대학교" } ] },
    "about": { "body": "안재민 대표원장은 연세대학교 치과대학병원 구강악안면외과 외래교수이자 보건복지부 인증 구강악안면외과 전문의입니다. 2인 전문의 원장의 협진으로 원스톱 진료가 가능합니다.", "signature_quote": null, "supporting_image_url": "https://images.example.com/sujidental-doctor.jpg" },
    "philosophy": { "text": "정확한 진단 없이는 올바른 치료도 없다고 믿습니다. 그래서 첫 상담과 검사에 가장 많은 시간을 씁니다." },
    "atmosphere": { "text": "치료 과정을 미리 충분히 설명드리고, 편안하게 대기하실 수 있는 개별 공간을 마련했습니다." },
    "menu": { "label": "진료 항목", "mode": "item_consult", "items": [ { "name": "임플란트", "price": null, "description": null, "image_url": null, "badge": null }, { "name": "교정", "price": null, "description": null, "image_url": null, "badge": null }, { "name": "신경치료", "price": null, "description": null, "image_url": null, "badge": null } ], "full_list_link_enabled": true },
    "gallery": { "images": ["https://images.example.com/sujidental-1.jpg","https://images.example.com/sujidental-2.jpg"], "more_link_url": null },
    "reviews": null,
    "info": { "address": "경기 용인시 수지구 수지로296번길 51-2 미래빌딩 6층", "map_coordinates": { "lat": 37.32, "lng": 127.09 }, "hours": { "type": "structured", "structured": [ { "day": "tue", "open": "09:30", "close": "20:30", "break": ["13:00","14:30"], "last_order": "19:00", "closed": false }, { "day": "sat", "open": "09:00", "close": "14:00", "break": null, "last_order": "12:30", "closed": false }, { "day": "sun", "open": null, "close": null, "break": null, "last_order": null, "closed": true } ] }, "phone": "0507-1481-5082", "external_links": [ { "platform": "naver_reservation", "url": "https://naver.me/GlJozOt4" } ], "business_info": null },
    "sticky_cta": { "buttons": [ { "type": "reservation", "label": "네이버 예약", "action_value": "https://naver.me/GlJozOt4" }, { "type": "call", "label": "전화 예약", "action_value": "05071481082" } ] },
    "how_it_works": { "steps": [ { "order": 1, "title": "예약", "description": "네이버예약 또는 전화로 예약" }, { "order": 2, "title": "방문 진료", "description": "접수 후 진료" } ] },
    "faq": { "items": [ { "question": "주차 되나요?", "answer": "용인시평생학습관 주차장을 이용해주세요." } ] }
  }
}
```
핵심: headline은 사용자 원문("가장 좋은")을 검증 가능한 사실 기반("24년 경력, 전문의")으로 조정한 결과(reviews는 유저가 원문을 준 적 없어 null — 규제 여부와 무관).

### 예시 F — 아이비스터디카페 (스터디카페 · 신뢰형 · 갤러리우선 · package_table · direction CTA)
```json
{
  "meta": { "business_name": "아이비스터디카페 매탄권선점", "industry_category": "스터디카페", "axis_a_tone": "신뢰형", "axis_b_layout": "갤러리우선", "cta_primary_action": "direction", "cta_interaction_mode": "functional", "logo_url": "https://images.example.com/ivy-logo.png", "brand_color": null },
  "blocks": {
    "topbar": { "display_name": "아이비스터디카페", "action_button": { "type": "direction", "label": "오시는 길" } },
    "hero": { "badge": "권선동 · 24시간 무인 스터디카페", "headline": "24시간 언제나, 포커스존부터 프라이빗룸까지", "tagline": "카페존과 포커스존이 분리돼 있어 집중하기 좋고, 사물함 대여도 가능해요.", "background_image_url": "https://images.example.com/ivy-hero.jpg", "cta": { "type": "direction", "label": "오시는 길" } },
    "trust_strip": { "items": [ { "value": "24시간", "label": "무인 운영" }, { "value": "1인실", "label": "프라이빗룸" }, { "value": "분리형", "label": "포커스존·카페존" } ] },
    "about": null,
    "philosophy": { "text": "집중이 안 되는 건 대부분 공간 탓이라고 생각해요. 그래서 소음과 동선을 계속 고민하며 지금의 분리형 구조를 만들었습니다." },
    "atmosphere": { "text": "밤 늦게까지 조용히 불이 켜진 포커스존과, 잠깐 쉬어갈 수 있는 카페존의 낮은 조도 — 각자의 리듬에 맞춰 머무를 수 있는 공간입니다." },
    "menu": { "label": "이용권", "mode": "package_table", "items": null, "categories": [ { "category_name": "당일권", "tiers": [ {"label":"2시간","price":"4,000원"}, {"label":"4시간","price":"5,000원"}, {"label":"8시간","price":"9,000원"}, {"label":"12시간","price":"11,000원"} ], "representative_tier_index": 0 }, { "category_name": "시간권", "tiers": [ {"label":"30시간","price":"50,000원"}, {"label":"50시간","price":"70,000원"}, {"label":"100시간","price":"120,000원"} ], "representative_tier_index": 0 }, { "category_name": "기간권", "tiers": [ {"label":"2주","price":"70,000원"}, {"label":"4주","price":"120,000원"}, {"label":"8주","price":"230,000원"} ], "representative_tier_index": 1 }, { "category_name": "고정석", "tiers": [ {"label":"4주","price":"180,000원"}, {"label":"8주","price":"350,000원"} ], "representative_tier_index": 0 } ], "full_list_link_enabled": true },
    "gallery": { "images": ["https://images.example.com/ivy-1.jpg","https://images.example.com/ivy-2.jpg","https://images.example.com/ivy-3.jpg"], "more_link_url": "https://naver.me/5gYYWNrJ" },
    "reviews": { "items": [ { "body": "이 동네 스카 다 다녀봤지만 가장 좋습니다. 분위기 흐리는 친구도 없고, 시스템·편의시설·준비물 등등 다른 곳 대비 완벽합니다.", "rating": null, "author": "익명", "source": "네이버 리뷰" }, { "body": "프라이빗룸이 있어서 다른 스터디카페보다 집중하기 좋아요.", "rating": null, "author": "익명", "source": "네이버 리뷰" } ] },
    "info": { "address": "경기 수원시 권선구 동수원로242번길 20 2층 204호", "map_coordinates": { "lat": 37.26, "lng": 127.02 }, "hours": { "type": "24h", "structured": null }, "phone": "010-3026-9321", "external_links": [ { "platform": "naver_reservation", "url": "https://naver.me/5gYYWNrJ" } ], "business_info": null },
    "sticky_cta": { "buttons": [ { "type": "direction", "label": "오시는 길", "action_value": "#info" }, { "type": "call", "label": "전화 문의", "action_value": "01030269321" } ] },
    "how_it_works": { "steps": [ { "order": 1, "title": "좌석·이용권 선택", "description": "현장 키오스크에서 원하는 좌석과 이용권 선택" }, { "order": 2, "title": "결제 후 이용", "description": "결제 즉시 바로 이용 시작" } ] },
    "faq": { "items": [ { "question": "위치가 어디인가요?", "answer": "롯데마트 뒤 롯데리아 건물 2층입니다." }, { "question": "대여 가능한 물품은 뭐가 있나요?", "answer": "스탠드, 담요, 독서대 등 다양한 문구·사무용품이 구비되어있습니다." } ] }
  }
}
```
핵심: `mode: package_table`이면 items=null, categories 채움. `cta_primary_action: direction`이 히어로·하단바 모두 "오시는 길"로 일관.
