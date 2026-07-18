-- vertical(업종 대분류: general·boutique-fitness) 판별 결과를 명시적으로 저장한다.
-- content_json 안의 필드 구성만으로 vertical을 역추론하는 건 취약하다(우연히
-- 구분되는 필드에 의존하게 됨, 새 vertical이 추가되거나 스키마가 또 바뀌면
-- 깨짐) — 렌더러가 어떤 컴포넌트 트리를 그릴지 판단할 때 이 컬럼을 진실의
-- 원천으로 삼는다. src/lib/verticals.ts의 VERTICALS 배열이 이미 vertical
-- 목록의 실제 source of truth이므로, Postgres enum 대신 text+check로 가볍게
-- 맞춘다(spec/README.md 6장 — 새 vertical 추가 시 enum보다 다루기 단순함).
alter table public.sites
  add column if not exists vertical text not null default 'general'
  check (vertical in ('general', 'boutique-fitness'));

comment on column public.sites.vertical is '업종 대분류(general·boutique-fitness). generate-content.ts의 determineVertical() 결과를 그대로 저장 — 렌더러가 어떤 컴포넌트 트리를 쓸지 이 값으로 판단.';
