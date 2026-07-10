-- 유저가 만든 미니홈페이지 1건 = 1행. id가 {id}.cornerpage.co 서브도메인이 된다.
-- content_json은 schema/content.schema.json(MiniHomepageContent)을 그대로 저장한다.
-- 스키마 검증은 DB가 아니라 이 값을 쓰는 API 레이어(ajv 등)에서 한다.
create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  content_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.sites is '유저가 생성한 미니홈페이지. id가 {id}.cornerpage.co 서브도메인이 된다.';
comment on column public.sites.content_json is 'MiniHomepageContent 스키마 그대로 (schema/content.schema.json)';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sites_set_updated_at
  before update on public.sites
  for each row
  execute function public.set_updated_at();

-- 미니홈페이지는 공개 웹페이지이므로 누구나 읽을 수 있어야 한다.
-- 쓰기(insert/update/delete)는 정책을 만들지 않는다 — anon/authenticated는 기본
-- 거부되고, 추후 만들 백엔드 API가 service_role 키(RLS 우회)로만 기록한다.
alter table public.sites enable row level security;

create policy "sites are publicly readable"
  on public.sites
  for select
  to anon, authenticated
  using (true);
