# 미니홈페이지빌더 — 디자인 템플릿 개발 핸드오프

## 이 폴더는 무엇인가

소상공인용 미니홈페이지 생성 서비스의 "0단계"(디자인 템플릿) 개발을 위한 핸드오프 패키지입니다. Claude Code 세션에서 이 폴더를 읽고 실제 렌더링 코드를 만드는 데 씁니다.

## 전체 아키텍처 (필수 이해)

```
[0단계 — 지금 이 작업] 디자인 템플릿 (1회성 개발, 코드)
       ↓ 콘텐츠 JSON을 입력받아 실제 화면을 그림

[1단계 — 완료됨] 정보 → 콘텐츠 JSON (매 사용자마다, LLM/스킬)
       ↓ Claude Skill(mini-homepage-builder)이 담당. 여기서 카피 생성·블록 온오프·업종 판단이 일어남.

[2단계 — 지금 이 작업의 산출물] 콘텐츠 JSON → 화면 렌더링 (매 사용자마다, 비LLM 코드)
       ↓ 이 폴더에서 만들 템플릿이 담당. LLM 없이 결정적으로 동작해야 함.
```

**핵심: 이 작업(0단계 개발)의 결과물이 2단계에서 실행되는 렌더러가 됩니다.** LLM 판단은 이미 1단계(스킬)에서 끝났고, 여기서는 순수하게 "JSON을 받아서 정해진 규칙대로 화면을 그리는 코드"만 만들면 됩니다. 창의적 판단(카피가 뭐가 될지, 어느 블록을 켤지)은 이미 완료된 입력값이니 다시 고민할 필요 없습니다.

## 만들어야 할 것

1. **10개 블록의 React 컴포넌트** (`schema/content.types.ts`의 각 블록 타입을 그대로 prop으로 받음): Topbar, Hero, TrustStrip, About, Menu(3가지 mode 분기 — item_price/item_consult/package_table), Gallery, Reviews, Info, StickyCta, HowItWorks, Faq
2. **3개 톤 프리셋 CSS 디자인 토큰** (`design-guide.md` 3장 참조): 감성형·신뢰형·혼합형
3. **레이아웃 조립 로직**: `meta.axis_b_layout`에 따라 블록 순서를 결정하는 최상위 컴포넌트(`design-guide.md` 4장의 순서 그대로)
4. **Null 폴백 렌더링**: `design-guide.md` 5장의 표대로, 각 null 필드가 어떻게 렌더링되어야 하는지 정확히 구현
5. **최상위 렌더러**: `MiniHomepageContent` 전체를 받아서 완성된 페이지를 그리는 컴포넌트

## 읽는 순서

1. `design-guide.md` — 전체를 한 번 정독. 7원칙의 시각적 번역(1장), 톤별 토큰(3장), 레이아웃 규칙(4장), null 폴백(5장)이 핵심.
2. `schema/content.types.ts` — 정확한 타입 구조. 컴포넌트의 prop 타입은 여기서 그대로 가져다 쓰면 됩니다.
3. `schema/content.schema.json` — 타입과 동일 내용의 JSON Schema. 런타임 검증이 필요하면 사용(예: `ajv` 라이브러리).
4. `fixtures/*.json` — 검증된 실제 콘텐츠 JSON 6개. 개발 중 이 파일들을 그대로 렌더링해보며 확인.

## fixtures 목록 (다양한 축 조합을 커버하도록 선정됨)

| 파일 | 업종 | 톤(축A) | 레이아웃(축B) | 특이사항 |
|---|---|---|---|---|
| `cafe-millmuldabang.json` | 카페 | 감성형 | 메뉴우선 | 기본 케이스, 사진 있음 |
| `funeral-sambo.json` | 장례용품 | 신뢰형 | 해당없음 | **사진 없음 → 히어로 폴백 필수 검증**, 갤러리 블록 없음 |
| `nail-ofyoon.json` | 네일샵 | 감성형 | 갤러리우선 | 갤러리가 메뉴보다 앞, about 블록 null |
| `gym-thorgym.json` | 헬스장 | 혼합형 | 갤러리우선 | 메뉴 항목 1개뿐(하한 강제 없음 확인용) |
| `dental-suji.json` | 치과 | 신뢰형 | 메뉴우선 | 사업자정보·FAQ 1개 포함 |
| `studycafe-ivy.json` | 스터디카페 | 신뢰형 | 갤러리우선 | **`menu.mode === "package_table"` 분기 렌더링 필수 검증**, `cta_primary_action === "direction"` |

이 6개를 전부 정상적으로(디자인 품질 저하 없이) 렌더링할 수 있으면 템플릿 시스템이 일반화됐다고 볼 수 있습니다.

## 참고: 손으로 만든 초기 프로토타입 (디자인 톤 참고용, 코드 재사용 금지)

이전 단계에서 3개 업종(카페·장례용품·네일샵)을 순수 HTML/CSS로 손으로 만들어봤습니다. 이건 "이런 느낌"이라는 디자인 참고용이며, 실제 컴포넌트 코드는 여기서 복붙하지 말고 `design-guide.md`의 토큰 시스템에 따라 새로 설계하세요(손 코드는 컴포넌트화·재사용을 고려하지 않은 1회성 프로토타입이라 구조가 다릅니다). 필요하면 요청 시 별도 전달 가능합니다.

## 완료 기준 (Definition of Done)

- [ ] 6개 fixture 전부 렌더링 성공, 시각적으로 톤 구분이 뚜렷함
- [ ] `menu.mode`의 3가지 분기(item_price/item_consult/package_table)가 모두 다르게 렌더링됨
- [ ] null 필드가 있는 모든 fixture(funeral-sambo, nail-ofyoon 등)에서 폴백이 "빈 공간"이 아니라 "완결된 대안"으로 보임
- [ ] 모바일 뷰포트(375px 기준)에서 첫 화면에 배지·헤드라인·CTA가 스크롤 없이 보임
- [ ] 반응형 대비, 키보드 포커스, reduced-motion 대응 확인
- [ ] frontend-design 가이드가 경고하는 3대 AI 클리셰(웜크림+테라코타, 다크+네온, 하이컨트라스트 브로드시트)에 해당하지 않는지 육안 확인
