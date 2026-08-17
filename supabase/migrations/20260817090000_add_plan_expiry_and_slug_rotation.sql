-- 유료 구독(slug 고정) 준비: 결제 연동은 아직 안 붙이고, plan/plan_expires_at을
-- 운영자가 DB에 직접 입력하는 방식으로 우선 게이팅한다. plan_expires_at은 지금은
-- 참고용(자동 만료 처리 없음) — 나중에 결제 웹훅이 붙으면 그 값을 갱신하는 주체가 바뀔 뿐,
-- 여기 게이팅 로직은 그대로 재사용된다.
alter table public.profiles add column if not exists plan_expires_at timestamptz;

alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'pro'));

comment on column public.profiles.plan_expires_at is '유료 구독 만료 시각. 지금은 운영자가 직접 입력. null이면 무기한(또는 free).';

-- 사이트별 "다음 슬러그 로테이션 예정 시각". free 사이트는 로테이션마다 +7일로
-- 갱신되고, pro인 동안에는 로테이션 대상에서 제외되며 이 값도 건드리지 않는다.
-- pro -> free로 내려가면 얼려뒀던 과거 값이 그대로 남아있어 다음 크론 실행 때
-- 바로 로테이션 대상으로 잡힌다 — "구독 취소 시 즉시 편입"을 별도 분기 없이 만족시킨다.
alter table public.sites add column if not exists slug_rotates_at timestamptz;

update public.sites
  set slug_rotates_at = coalesce(slug_rotates_at, created_at + interval '7 days')
  where slug_rotates_at is null;

alter table public.sites alter column slug_rotates_at set not null;
alter table public.sites alter column slug_rotates_at set default (now() + interval '7 days');

comment on column public.sites.slug_rotates_at is '다음 슬러그 자동 로테이션 예정 시각(free 전용). pro인 동안은 갱신되지 않고 얼려진다.';

create extension if not exists pg_cron with schema extensions;

-- free(또는 만료된 pro) 사이트 중 로테이션 시각이 지난 것만 골라 슬러그를 새로
-- 발급한다. 랜덤 생성 로직은 set_default_slug()와 동일(20자리 hex, 충돌 재시도).
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
    join public.profiles p on p.id = s.owner_id
    where s.owner_id is not null
      and s.slug_rotates_at <= now()
      and not (p.plan = 'pro' and (p.plan_expires_at is null or p.plan_expires_at > now()))
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

comment on function public.rotate_free_site_slugs() is 'free(또는 만료된 pro) 사이트의 slug를 주기 실행으로 재발급한다. pg_cron이 호출.';

-- 1시간마다 체크 — 사이트마다 실제 로테이션은 slug_rotates_at 기준 7일 주기지만,
-- pro 해지 시 "즉시 편입"의 체감 지연을 최소화하려고 실행 자체는 자주 돈다.
-- named schedule이라 재실행(마이그레이션 재적용)해도 기존 잡을 덮어써 안전하다.
select cron.schedule(
  'rotate-free-site-slugs',
  '0 * * * *',
  $$select public.rotate_free_site_slugs();$$
);
