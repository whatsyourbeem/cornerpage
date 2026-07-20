---
id: boutique-fitness
name: "코너페이지 · 부티크 피트니스 (PT·필라테스·요가)"
vertical: boutique-fitness
tone_name: "차분한 확신 (Grounded Confidence)"
axis_system: none
axis_system_note: >
  general은 axis_a_tone(감성형/신뢰형/혼합형)·axis_b_layout(갤러리우선/메뉴우선)으로
  업체마다 톤·레이아웃을 분류하지만, 이 vertical은 definition.md에서 확정한
  고정 논리(증거 우선 순서)로 블록 구성·순서·톤을 vertical 전체에 고정한다.
  업체별 분류 필드는 없다 — 대신 `meta.lead_emphasis`(사장님 자기보고)만 존재.
verified: "2026-07-16"
omd_style_ref: "oh-my-design.kr/drnow (구조 참고, 색상·컴포넌트는 자체 도출)"
tokens:
  colors:
    brand: "#1F3A35"
    brand-deep: "#12211D"
    brand-light: "#EAF1EF"
    accent: "#E8663D"
    accent-deep: "#C94F2B"
    accent-on-dark: "#FF8B65"
    paper: "#FAF8F5"
    paper-alt: "#F3EFE9"
    ink: "#26241F"
    ink-body: "#57534A"
    ink-muted: "#8B857A"
    border: "#E3DED4"
    star: "#E8A93D"
    error: "#D64545"
  typography:
    family: { sans: "Pretendard Variable" }
    h-32: { size: 32, weight: 700, lineHeight: 1.3,  use: "히어로 헤드라인" }
    h-28: { size: 28, weight: 700, lineHeight: 1.35, use: "섹션 제목(비포애프터·리뷰 등 블록 타이틀)" }
    h-22: { size: 22, weight: 700, lineHeight: 1.4,  use: "카드 내 제목(전문가 이름 등)" }
    h-18: { size: 18, weight: 600, lineHeight: 1.4,  use: "카드 제목, 서브헤딩" }
    body-17: { size: 17, weight: 600, lineHeight: 1.4, use: "CTA 버튼 라벨" }
    body-16: { size: 16, weight: 400, lineHeight: 1.6, use: "기본 본문" }
    body-15: { size: 15, weight: 400, lineHeight: 1.5, use: "보조 본문(카드 설명·FAQ 답변)" }
    caption-13: { size: 13, weight: 500, lineHeight: 1.4, use: "캡션(비포애프터 기간, 리뷰 출처, 자격증 태그)" }
    number-40: { size: 40, weight: 700, lineHeight: 1.2, use: "신뢰 스트립 큰 숫자" }
  spacing: { xs: 4, sm: 8, md: 12, base: 16, lg: 24, xl: 32, xxl: 48, section: 96 }
  rounded: { sm: 8, md: 12, lg: 24, full: 9999 }
  shadow:
    floating: "0px 2px 8px rgba(0,0,0,0.06)"
    sticky: "0px -2px 8px rgba(0,0,0,0.08)"
    modal: "0px 4px 12px rgba(0,0,0,0.08)"
  components:
    button-primary:   { type: button, bg: "#E8663D", fg: "#FFFFFF", radius: 12, padding: "16px 32px", font: "17px/600", use: "주 CTA(상담 신청 등), hover는 accent-deep" }
    button-outline:    { type: button, bg: "transparent", fg: "#1F3A35", border: "1px solid #1F3A35", radius: 12, padding: "16px 24px", font: "16px/600", use: "보조 행동" }
    tag-cert:          { type: badge, bg: "#EAF1EF", fg: "#1F3A35", radius: 9999, padding: "4px 10px", font: "13px/600", use: "자격증·전문분야 칩" }
    card-evidence:     { type: card, bg: "#FAF8F5", border: "1px solid #E3DED4", radius: 24, padding: "24px", use: "비포애프터·리뷰 카드" }
    card-professional: { type: card, bg: "#FFFFFF", border: "1px solid #E3DED4", radius: 24, padding: "24px", use: "전문가 프로필 카드" }
    facility-item:     { type: list-item, icon_color: "#1F3A35", label_font: "15px/400", use: "시설 스펙 아이콘+라벨 행" }
    before-after-slider: { type: interactive, handle_color: "#E8663D", transition: "150ms ease-out", use: "비포/애프터 드래그 비교 — 이 vertical의 시그니처 인터랙션" }
    inquiry-dialog:    { type: modal, bg: "#FFFFFF", radius: 24, padding: "24px", overlay: "rgba(18,33,29,0.5)", use: "topbar·hero·하단 FAB의 cta_label 버튼 클릭 시 열리는 채널 목록 다이얼로그(2026-07-17 신규)" }
    fab-button:        { type: button, shape: pill, bg: "#E8663D", fg: "#FFFFFF", shadow: floating, position: "fixed bottom-right", use: "하단 CTA(2026-07-17, 바에서 플로팅 버튼으로 전환) — 히어로 통과 후 페이드인 등장" }
    channel-button:    { type: button, bg: "#FAF8F5", border: "1px solid #E3DED4", radius: 12, padding: "14px 16px", font: "16px/600", icon_color: "#1F3A35", use: "다이얼로그 안의 개별 채널 버튼(전화·카카오톡 등), 히어로의 browse_channels 버튼도 동일 스타일 재사용" }
  components_harvested: false
---

> 이 문서 안의 `definition.md`는 `../../for-context/boutique-fitness/definition.md`를, `blocks.md`는 `../../for-context/boutique-fitness/blocks.md`를 가리킨다(같은 폴더에 없음 — 폴더 구조는 README.md 1장 참고).

부티크 피트니스(PT·필라테스·요가 등 1:1/소수정예 지도형 스튜디오) 전용 고정 디자인 톤. `definition.md`의 판단(직접증거 우선, 강매 불안 해소, 절제된 확신)을 시각 언어로 번역한 것이다.

## 1. Visual Theme & Atmosphere

이 vertical의 디자인은 하나의 감정적 약속에서 출발한다 — **"소리치지 않아도 믿을 만하다."** 실제 시장 조사에서 확인한 대형 PT 체인들(버핏그라운드·쓰리핏)의 빨강+검정 조합은 강렬하지만 "공격적 세일즈"의 인상을 남긴다. 이는 우리가 `definition.md`에서 가장 공들여 지우려 한 불안(강매 걱정)을 시각적으로 되살리는 것과 같다. 그래서 이 톤은 의도적으로 그 반대 방향을 택한다 — 딥 그린틸(`#1F3A35`)이라는 차분하고 그라운디드한 주색에, 테라코타 코랄(`#E8663D`)을 오직 "증거를 가리키는 손가락"처럼 좁게만 쓴다.

배경은 병원처럼 차가운 흰색이 아니라 따뜻한 오프화이트(`#FAF8F5`)를 쓴다 — 신뢰형(신뢰가 핵심인 업종)의 차가움도, 감성형의 아기자기함도 아닌, **"전문적이지만 문턱이 낮은" 중간 지대**를 만든다. 이는 `definition.md`가 짚은 "나도 할 수 있을까"라는 진입장벽 불안을 완화하기 위함이다.

타이포는 Pretendard Variable을 그대로 쓰되(제품 전체 공통 결정), 헤드라인은 굵되 과도하게 크지 않다(32px 상한) — 소리 지르는 확신이 아니라 **절제된 확신**을 표현한다.

## 2. Color Palette & Roles

### Primary (Grounded Teal — 신뢰의 근간)
- **Brand:** `#1F3A35` — 상단바 배경, 보조 버튼 텍스트/테두리, 아이콘 기본색
- **Brand Deep:** `#12211D` — 다크 섹션(예: 하단 푸터, sticky_cta 배경), 다크 배경 위 텍스트 대비 확보용
- **Brand Light:** `#EAF1EF` — 자격증 태그 배경, 증거 클러스터 섹션의 미묘한 배경 구분(선택적)

### Accent (Terracotta Coral — 증거·행동 전용)
- **Accent:** `#E8663D` — **오직 두 곳에만 사용**: (1) 주 CTA 버튼, (2) 비포/애프터의 핵심 수치(예: "−8kg", "12주") 강조 텍스트. 그 외 장식적 용도로 확대 사용 금지.
- **Accent Deep:** `#C94F2B` — accent 요소의 hover/pressed 상태
- **Accent on Dark:** `#FF8B65` — `brand-deep` 같은 어두운 배경 위에서 accent를 써야 할 때(예: 다크 sticky CTA 안의 버튼)

### Neutral (Warm Gray — 본문·배경)
- **Paper:** `#FAF8F5` — 기본 페이지 배경
- **Paper Alt:** `#F3EFE9` — 섹션 교차 배경(예: 시설 스펙 블록 배경)
- **Ink:** `#26241F` — 헤딩(순검정 `#000000` 금지 — general의 "순검정 회피" 관례 계승)
- **Ink Body:** `#57534A` — 본문 텍스트
- **Ink Muted:** `#8B857A` — 캡션·메타 정보(리뷰 출처, 비포애프터 기간)
- **Border:** `#E3DED4` — 카드 테두리, 구분선

### System
- **Star:** `#E8A93D` — 리뷰 별점(따뜻한 골드, Dr.Now류 형광 옐로우보다 톤 낮춤)
- **Error:** `#D64545` — 폼 검증 실패 등 드문 상황에만

## 3. Typography Rules

Pretendard Variable 단독 사용(폴백 체인은 general과 동일). 이탤릭 사용 금지(`font-style: normal` 강제 — general 관례 유지).

| 용도 | 크기 | 굵기 | 줄높이 |
|---|---|---|---|
| 히어로 헤드라인 | 32px | 700 | 1.3 |
| 섹션 제목 | 28px | 700 | 1.35 |
| 카드 내 제목(전문가 이름 등) | 22px | 700 | 1.4 |
| 카드 제목/서브헤딩 | 18px | 600 | 1.4 |
| CTA 버튼 라벨 | 17px | 600 | 1.4 |
| 기본 본문 | 16px | 400 | 1.6 |
| 보조 본문 | 15px | 400 | 1.5 |
| 캡션(비포애프터 기간·리뷰 출처·자격증 태그) | 13px | 500 | 1.4 |
| 신뢰 스트립 큰 숫자 | 40px | 700 | 1.2 |

## 4. Component Stylings

### 4-1. 신규 블록 컴포넌트 (이 vertical 전용)

**비포/애프터 슬라이더 (`transformations`) — 시그니처 컴포넌트**
- 좌우 드래그(모바일은 터치 드래그) 방식으로 전/후 사진을 비교
- 핸들 색상: `--accent`, 트랜지션 150ms ease-out
- 핵심 수치(예: "−8kg", "12주")는 `--accent` 색으로 강조, `body-17/600`
- 캡션: `caption-13`, `--ink-muted` — "OOO님 · 12주 변화" 형식, 담당 전문가 태그는 선택적으로 작은 `tag-cert` 스타일로 병기
- 카드: `card-evidence` 스타일(배경 `--paper`, 테두리 1px `--border`, radius 24px, padding 24px)

**전문가 프로필 카드 (`professionals`)**
- 카드: `card-professional`(배경 `#FFFFFF`로 evidence 카드와 미묘하게 구분, radius 24px)
- 사진: 둥근 사각형(radius 16px), 정사각 비율
- 이름: `h-22`, 직함: `body-15`/`--ink-muted`
- 자격증·전문분야: `tag-cert` 칩으로 나열(배경 `--brand-light`, 텍스트 `--brand`)
- 한 줄 지도철학(`bio_quote`): `body-16`, 인용부호 없이(콘텐츠 원칙은 `../../for-context/boutique-fitness/blocks.md` 참고)

**시설 스펙 (`facility`)**
- 아이콘(24px, `--brand` 색) + 라벨(`body-15`) 행 반복, 2~3열 그리드
- 불리언 항목(샤워실·라커 등): 체크/엑스 아이콘
- 수치 항목(평수 등): 숫자만 크게, 라벨 작게(신뢰 스트립과 유사한 축소 버전)
- **`atmosphere_text`(2026-07-17 신규 필드)**: 아이콘 그리드 위쪽에 `body-16` 문단으로 배치(옛 독립 `atmosphere` 블록과 같은 텍스트 스타일 — 문단 형태 유지, 그리드와는 위아래로만 구분). 없으면(`null`) 이 문단만 생략하고 아이콘 그리드부터 시작 — 시설 블록 전체가 꺼지는 게 아님.
- 배경: `--paper-alt`로 갤러리와 살짝 구분되는 섹션임을 표시

**문의 다이얼로그 (`inquiry-dialog`) — 2026-07-17 신규, 이 vertical의 두 번째 시그니처 컴포넌트**
- 상단고정바·히어로·하단CTA바의 `cta_label` 버튼을 누르면 열림(별도 페이지 이동 없음, 모달)
- `meta.inquiry_channels` 배열을 세로로 나열 — 각 채널은 `channel-button` 스타일(아이콘+텍스트, 배경 `--paper`, 테두리 1px `--border`)
- 채널별 아이콘·기본 라벨은 `type`에 따라 고정 템플릿(전화="전화 문의", 카카오톡="카카오톡으로 문의", 네이버예약="네이버예약", 인스타DM="인스타그램 DM", 기타=`other_label` 그대로) — **LLM이 채널별 버튼 문구를 새로 쓰지 않는다**, 프론트엔드가 `type`만 보고 고정 템플릿으로 렌더링
- 배경 오버레이: `--brand-deep` 50% 불투명도
- 등장 애니메이션: 아래에서 위로 슬라이드업 200ms 또는 페이드인, 과하지 않게(이 vertical의 "차분한 확신" 톤 유지)

**히어로의 둘러보기 채널 버튼 행**
- `meta.browse_channels`가 있으면 CTA 버튼 아래에 가로로 나열(모바일은 줄바꿈)
- `channel-button` 스타일 재사용하되 더 작게(높이 축소), 아이콘 중심
- 다이얼로그와 달리 클릭 시 바로 새 탭에서 열림(다이얼로그를 한 번 더 거치지 않음 — 둘러보기는 이미 저부담 행동이라 확인 단계 불필요)



- **상단 고정바**: 배경 `--brand`, 텍스트 `#FFFFFF`, `cta_label` 버튼은 `button-primary` 스타일(클릭 시 `inquiry-dialog` 오픈)
- **히어로**: 배경 이미지 위 오버레이 `--brand-deep` 반투명(가독성), CTA는 `button-primary`(클릭 시 `inquiry-dialog` 오픈), 그 아래 `browse_channels` 버튼 행(있는 경우)
- **신뢰 스트립**: 숫자는 `number-40`/`--accent`, 라벨은 `caption-13`/`--ink-muted`
- **메뉴/서비스**: 카드 스타일은 `card-evidence`와 동일 톤이나 강조색 없이 중립적으로(가격 정보는 차분하게 — 강매 인상 방지)
- **위치/정보**: general 스타일 그대로(주소·시간·전화). 하단 링크 목록은 `meta.browse_channels`를 `channel-button` 스타일로 재사용해서 그린다(2026-07-17 — `info.external_links` 필드가 없어지고 `browse_channels`로 통합됨, 별도 필드 없음)
- **리뷰**: `card-evidence` 재사용, 별점은 `--star`. `trainer_tag`가 있으면 작성자명 옆에 `tag-cert` 스타일의 작은 칩으로 표시(자격증 칩과 같은 스타일 재사용 — 배경 `--brand-light`, 텍스트 `--brand`)
- **하단 CTA(플로팅 액션 버튼)**: `--accent` 배경, 흰 텍스트(2026-07-17 — 바 형태에서 FAB로 전환, 상세는 10-4절) — 클릭 시 `inquiry-dialog` 오픈(상단바·히어로와 동일한 다이얼로그, 별도 상태 없음)

## 5. Layout Principles

- **컨테이너**: max-width 1080px, 중앙 정렬, 좌우 여백 92%
- **섹션 간격**: 데스크톱 96px, 모바일 64px
- **모바일 브레이크포인트**: 768px
- **블록 배치 순서** (원본은 `../../for-context/boutique-fitness/blocks.md` "확정된 블록 순서" — 콘텐츠 작성 원칙까지 필요 없다면 아래만 봐도 렌더링 순서를 알 수 있다):
  ```
  0. 상단 고정바
  1. 히어로
  2. 신뢰 스트립
  3. 비포/애프터 (transformations)
  3-1. 리뷰 (reviews)
  3-2. 전문가 프로필 (professionals)
  3-3. 철학 (philosophy)
  4. 갤러리 + 시설 스펙(facility, 분위기 서술 포함)
  5. 메뉴/서비스 (item_consult)
  6. 위치/정보
  7. 하단 CTA (플로팅 액션 버튼)
  8. 이용방법
  9. FAQ
  ```
  `lead_emphasis`(사장님이 고른 최우선 어필 포인트)에 따라 3~3-2 구간의 순서가 바뀔 수 있다. facility가 선택된 경우에만 예외적으로 4번 클러스터에서 분리되어 최상단(3번 자리)으로 이동한다.
- **증거 클러스터(비포애프터·리뷰·전문가) 배치**: 가로 캐러셀보다 **세로 스택 우선**. 이유: `definition.md`의 "정해진 순서로 지나가게 한다"는 선형적 설득 원칙상, 가로 스크롤은 사용자가 순서를 건너뛰기 쉬워 원칙과 충돌. 리뷰처럼 여러 개를 나열해야 하는 경우에도 세로로 2~3개만 보여주고 "더보기"로 확장하는 방식을 우선한다.
- **내비게이션 없음**(상단바 결정 참고 — `../../for-context/boutique-fitness/blocks.md` 블록 0)

## 6. Depth & Elevation

- **Level 0 — 페이지 배경**: `--paper`, 그림자 없음
- **Level 1 — 기본 카드**: `#FFFFFF` 또는 `--paper` + 1px `--border` — 그림자 대신 테두리로 구분(닥터나우와 동일한 절제 원칙)
- **Level 2 — 플로팅 요소(비포애프터 슬라이더 핸들, 버튼 hover)**: `shadow.floating`
- **Level 3 — 플로팅 액션 버튼(FAB)**: `shadow.floating`(사방으로 — 2026-07-17 이전엔 화면 폭 전체 바였어서 `shadow.sticky`를 썼으나, FAB로 바뀌며 일반 플로팅 요소와 동일한 그림자 방향으로 통일)
- **Level 4 — 모달/드롭다운(있다면)**: `shadow.modal`

## 7. Motion & Interaction

- **비포/애프터 슬라이더**: 드래그 시 150ms ease-out 추종. 자동재생 없음(사용자가 직접 조작해야 발견의 재미가 생김).
- **신뢰 스트립 숫자**: 뷰포트 진입 시 1회 카운트업(800ms).
- **카드 등장**: 스크롤 트리거 페이드업(20px 이동, 300ms), 리뷰처럼 여러 개면 80ms 간격 순차 등장.
- **금지**: 바운스, 패럴랙스, 자동 슬라이드. 이 vertical은 "차분한 확신"이 핵심이라 장식적 모션이 오히려 신뢰를 깎는다.

## 8. Do's and Don'ts

### Do
- `--accent`(코랄)는 CTA 버튼과 비포애프터 핵심 수치, **이 두 곳에만** 사용
- 카드 radius는 24px로 통일(증거 카드·전문가 카드 동일)
- 순검정(`#000000`) 대신 `--ink`(`#26241F`) 사용
- 비포애프터에는 반드시 기간·변화 캡션을 함께 표기(사진만 단독 배치 금지 — 맥락 없는 사진은 증거력이 약함)
- 증거 클러스터는 세로 스택으로, 방문자가 순서대로 지나가게 배치

### Don't
- 빨강+검정 조합 금지(대형 PT 체인의 "공격적 세일즈" 룩과 겹침 — `definition.md` 반례 참고)
- `--accent`를 섹션 배경 전체나 큰 색 블록에 쓰지 않음(과장·가짜 긴급함과 같은 시각적 효과)
- 가짜 카운트다운, "마감임박" 배지 등 긴급함을 조작하는 장치 금지(`copywriting.md` 4-1 원칙의 시각적 연장)
- 상단바에 내비게이션 메뉴를 넣지 않음(`blocks.md` 참고)
- 비포애프터 사진에 과도한 필터·보정 느낌의 스타일 적용 금지(신뢰 훼손 위험)

## 9. 브랜드 컬러 오버라이드

`meta.brand_color`가 지정된 경우의 처리 로직은 general의 `design-guide.md` 3-4장과 동일한 메커니즘(씨앗 색 기반 결정적 팔레트 생성, WCAG 4.5:1 대비 보정)을 그대로 따른다 — 여기서 재정의하지 않는다. 단, 구조적 토큰(타이포·모션·컴포넌트 형태·"accent는 증거·CTA에만" 같은 이 vertical의 원칙)은 브랜드 컬러 유무와 무관하게 유지된다.

## 10. 블록별 상세 디자인 명세

`blocks.md`(콘텐츠 설계 근거 문서, `for-context/`에 위치 — API로는 전송되지 않음, 실질 지침은 `schema-summary.md`에 이미 압축되어 있음)와 짝을 이루는 디자인 명세. 블록별 콘텐츠 논의와 함께 정하되, 저장 위치는 반드시 이 문서로 분리한다 — 디자인 정보(hex·px 등)가 `for-claude-api/`의 프롬프트 파일에 섞이면 불필요한 토큰 비용이 발생하기 때문이다.

### 10-1. 상단 고정바
- 배경: `--brand`(`#1F3A35`), 텍스트: `#FFFFFF`
- 높이: 64px, `position: sticky`(상단 고정)
- 가게명/로고 텍스트: `h-18`(18px/600), 흰색. 로고 이미지가 있으면 세로 32px 이내로 제한(바 높이 대비 여유 확보)
- `cta_label` 버튼: `button-primary` 컴포넌트(배경 `--accent`, 텍스트 흰색, radius 12px, padding "16px 32px", `body-17`) — 클릭 시 `inquiry-dialog` 오픈(2026-07-17 변경, 예전 `action_button`은 단일 채널 직결이었음)
- 좌: 가게명/로고, 우: `cta_label` 버튼 — 중앙 배치 요소 없음(내비게이션 없음 결정과 일치)

### 10-2. 히어로
- 배경: `background_images`(2026-07-17부터 배열)가 있으면 전체 배경 + `--brand-deep`(`#12211D`) 반투명 오버레이(약 45% 불투명도)로 가독성 확보. **여러 장이면 순서대로 전환하며 줌 애니메이션 적용(렌더러에 이미 구현됨 — 여기선 스펙만 확정)**. 없으면 `--brand-deep` 단색 폴백.
- 배지: 반투명 흰색 배경의 작은 필(pill), 흰 텍스트, `caption-13/600`
- 헤드라인: `h-32`(32px/700), 흰색. **줄바꿈은 `\n`을 실제 줄바꿈으로 표시**(`white-space: pre-line` 등 — 렌더러 구현) — 콘텐츠 JSON의 `\n`이 곧 의도된 줄바꿈 위치이므로 CSS가 임의로 재배치하지 않는다.
- 태그라인: `body-16`, 흰색 80% 불투명도(헤드라인과의 위계 구분)
- `cta_label` 버튼: `button-primary` — 클릭 시 `inquiry-dialog` 오픈
- `browse_channels` 버튼 행: CTA 버튼 바로 아래, `channel-button` 스타일 축소판(있는 경우만 렌더링)
- 최소 높이: 데스크톱 480px / 모바일 400px. 상단고정바(64px) 아래로 자연스럽게 이어지도록 상단 padding 확보

### 10-4. 하단 CTA — 플로팅 액션 버튼(FAB)로 전환 (2026-07-17)

> ⚠️ **개정**: 화면 폭을 가로지르는 바(bar) 형태를 폐기하고 플로팅 버튼으로 바꿨다. 버튼이 결국 `cta_label` 하나뿐인데 굳이 전체 폭을 점유할 이유가 없었고, 오히려 스크롤 내내 화면 하단을 계속 차지하는 게 "차분한 확신" 톤·"작고 되돌릴 수 있게"라는 원칙과 미묘하게 어긋났다 — 방문자가 증거 블록을 훑는 내내 뭔가를 계속 요구받는 인상을 줄 수 있었다. 한쪽 구석에 조용히 떠있는 플로팅 버튼이 "필요하면 누르세요" 쪽에 더 가깝다.

- **위치**: 화면 우측 하단(모바일 엄지 도달 영역 기준 표준 위치)
- **형태**: 완전한 원형이 아니라 **알약형(pill)** — 아이콘 + `cta_label` 텍스트를 그대로 담는다(원형 아이콘 버튼만 쓰면 저부담 카피 문구를 담을 자리가 없어짐)
- **색상**: `--accent` 배경 + 흰 텍스트(기존 "어두운 바 위의 밝은 버튼" 조합 폐기 — 바 자체가 없어졌으므로)
- **등장 시점**: 히어로를 스크롤로 지나간 뒤부터 표시(히어로 CTA와 화면에 동시에 겹치지 않게). 등장 애니메이션은 페이드인만 — 바운스 없음(기존 절제된 모션 원칙 유지)
- **동작**: 클릭 시 `inquiry-dialog` 오픈(상단바·히어로와 동일한 다이얼로그, 별도 상태 없음)
- **그림자**: `shadow.floating`(사방으로) — 기존 "위쪽으로만"이던 `shadow.sticky`는 바 형태 전용이라 이제 안 맞음, 아래 Depth & Elevation도 같이 수정

### 10-3. 신뢰 스트립
- 숫자: `number-40`(40px/700), `--accent` 색으로 강조 — 신뢰 스트립이 증거 클러스터로 들어가는 입구 역할이라, 뒤이어 나올 비포애프터의 강조색과 시각적으로 연결
- 라벨: `caption-13`, `--ink-muted`
- **아이콘(2026-07-17 신규)**: 숫자 위쪽에 24px 크기, `--brand` 색. lucide-react 컴포넌트를 `icon` 필드값(PascalCase 문자열)으로 그대로 매핑해 렌더링
- **하위호환 폴백**: `icon` 필드가 없거나(기존에 생성된 사이트) 12개 허용 목록 밖의 값이면, **아이콘 없이 숫자+라벨만** 렌더링한다(기존 디자인 그대로 유지) — 임의의 기본 아이콘으로 대체하지 않는다. 아무 의미도 없는 아이콘을 억지로 보여주는 것보다, "이 사이트는 아직 아이콘이 없다"는 상태를 있는 그대로 두는 쪽이 덜 혼란스럽다.
- 배경: `--paper`, 3개 항목 가로 배치(모바일은 축소 배치 또는 스크롤)

### 10-5. 위치/정보 (2026-07-17 신규 명세 — 접근성 강조)
**이 vertical에서 접근성은 핵심 신뢰 요소 중 하나다(`definition.md` 참고)** — 그냥 주소 텍스트 한 줄로 묻히면 안 된다.

- **지도 핀 마커**: `info.map_coordinates`(위도·경도)로 지도(네이버지도 또는 카카오맵 임베드)를 그리고, 그 좌표 위에 핀 마커를 표시한다. 지도 크기는 섹션 폭 100%, 높이 240px 권장. 핀 색상은 `--accent`(다른 지도 UI 요소와 구분되게).
- **`landmark_distance` 강조 배치**: 주소보다 **먼저**, 아이콘(예: `MapPin` 계열)과 함께 `body-17/600`(일반 본문보다 굵게)으로 표시. 있으면 이 문구가 정보 블록에서 시각적으로 가장 먼저 읽히는 텍스트가 되도록 — 주소는 그 아래 `body-15`/`--ink-muted`로 보조 정보처럼 배치.
- **`landmark_distance`가 `null`이면** 이 강조 줄 자체를 생략하고 주소만 일반 크기로 표시(빈 자리를 만들지 않음).
- **하단 링크**: `meta.browse_channels`를 `channel-button` 스타일로 재사용(4-2절 참고, `info.external_links` 폐기에 따른 변경).

### 10-6. 하단 정보 영역(footer, 2026-07-17 신규 명세)

**새 콘텐츠 필드는 없다** — 전부 이미 콘텐츠 JSON에 있는 값을 재조합해서 그린다(`meta.logo_url`·`info.address`·`info.phone`·`info.business_info`·`meta.browse_channels`). 이용약관·개인정보처리방침 링크만 예외로, 콘텐츠 JSON이 아니라 고정 템플릿(아래 참고)에서 온다.

- 배경: `--brand-deep`, 페이지 최하단(`sticky_cta`/FAB보다 아래, 스크롤해야 보임)
- 로고: `meta.logo_url` 있으면 표시(24px 높이), 없으면 `meta.business_name` 텍스트로 대체
- 주소·전화: `caption-13`, `--ink-muted`에 준하는 어두운 배경용 톤(흰색 70% 불투명도)
- 사업자정보(`info.business_info`): 있으면 가장 작은 크기(`caption-13`, 흰색 50% 불투명도)로 한 줄 — 등록상호명·대표자명·사업자등록번호 순. `null`이면 이 줄 자체를 생략(빈 자리 안 만듦)
- 소셜 링크: `meta.browse_channels`를 아이콘만으로(라벨 없이) 가로 나열, `channel-button`보다 작은 아이콘 전용 버전
- **이용약관·개인정보처리방침**: 콘텐츠 JSON에 필드 없음 — 고정 템플릿(정적 문서, `{{business_name}}`·`{{phone}}`·`{{address}}`·`{{business_info}}` 변수만 콘텐츠 JSON 값으로 치환, LLM 호출 없음)을 별도 페이지로 렌더링하고 여기서 링크만 건다. 템플릿 초안은 `for-frontend/boutique-fitness/legal-template.md` 참고(신규 파일, 실제 게시 전 법률 검토 권장이라는 주석 포함).

<!-- 다음 블록(비포/애프터)부터 이어서 기록 -->

---
**작성:** 2026-07-16, 코너페이지 프로젝트 대화 세션 기반
**구조 참고:** oh-my-design.kr/drnow (Dr.Now 브랜드 DESIGN.md) — 형식만 참고, 색상·컴포넌트 값은 `definition.md`의 boutique-fitness 고유 원칙에서 자체 도출
