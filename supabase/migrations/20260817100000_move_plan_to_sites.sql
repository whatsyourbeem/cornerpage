-- 결제 단위 정정: 계정(profiles)이 아니라 사이트(sites) 하나하나가 결제 단위다.
-- 계정에 홈페이지가 3개 있으면 슬러그를 고정하고 싶은 사이트마다 각각 구독해야
-- 한다 — 계정 전체를 한 번 pro로 올리면 모든 사이트가 공짜로 고정되는 지금
-- 구조(profiles.plan)는 틀렸다. plan/plan_expires_at을 sites로 옮긴다.
alter table public.sites add column if not exists plan text not null default 'free';
alter table public.sites add constraint sites_plan_check check (plan in ('free', 'pro'));
alter table public.sites add column if not exists plan_expires_at timestamptz;

comment on column public.sites.plan is '이 사이트의 구독 상태. pro면 slug 로테이션 대상에서 제외되고 자유롭게 변경 가능. 지금은 운영자가 직접 입력.';
comment on column public.sites.plan_expires_at is '이 사이트의 유료 구독 만료 시각. null이면 무기한(또는 free).';

alter table public.profiles drop column if exists plan_expires_at;
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles drop column if exists plan;

-- rotate_free_site_slugs()가 더 이상 profiles를 조인하지 않고 sites.plan을 직접 본다.
create or replace function public.rotate_free_site_slugs()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target record;
  candidate text;
begin
  for target in
    select s.id
    from public.sites s
    where s.owner_id is not null
      and s.slug_rotates_at <= now()
      and not (s.plan = 'pro' and (s.plan_expires_at is null or s.plan_expires_at > now()))
  loop
    loop
      candidate := substring(encode(extensions.gen_random_bytes(15), 'hex'), 1, 20);
      exit when not exists (select 1 from public.sites where slug = candidate);
    end loop;

    update public.sites
      set slug = candidate,
          slug_rotates_at = now() + interval '7 days'
      where id = target.id;
  end loop;
end;
$$;
