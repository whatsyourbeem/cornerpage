-- 로그인 도입: 계정(auth.users)마다 앱 도메인 데이터를 저장하는 profiles 테이블을
-- 추가하고, sites를 소유자와 연결한다. 결제(subscriptions)는 아직 만들지 않는다 —
-- profiles.plan을 나중에 그 기준점으로 쓴다.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  plan text not null default 'free',
  created_at timestamptz not null default now()
);

comment on table public.profiles is '계정별 앱 도메인 데이터(플랜 등). auth.users와 1:1.';

alter table public.profiles enable row level security;

create policy "profiles are viewable by owner"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "profiles are updatable by owner"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- auth.users에 신규 계정이 생기면 profiles row를 자동 생성한다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- sites 소유자 연결. 기존 fixture row는 소유자가 없으므로 nullable로 둔다.
alter table public.sites
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

comment on column public.sites.owner_id is '생성한 계정. 로그인 도입 이전 fixture row는 null.';

-- 실제 쓰기는 여전히 service_role(RLS 우회) 백엔드 API가 담당하지만,
-- 방어 계층 + 추후 클라이언트 직접 접근 대비로 소유자 기준 정책을 추가한다.
create policy "owners can update their own sites"
  on public.sites
  for update
  to authenticated
  using (auth.uid() = owner_id);

create policy "owners can delete their own sites"
  on public.sites
  for delete
  to authenticated
  using (auth.uid() = owner_id);
