-- 라우팅용 공개 식별자. id(uuid)는 내부 안정 식별자로 그대로 두고, slug는
-- 유저가 나중에 원하는 문자열로 바꿀 수 있는 {slug}.cornerpage.co 값이다.
-- 생성 시 비워두면 id를 그대로 복사해 기본값으로 쓴다.
alter table public.sites add column slug text;

create or replace function public.set_default_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.slug is null then
    new.slug := new.id::text;
  end if;
  return new;
end;
$$;

create trigger sites_set_default_slug
  before insert on public.sites
  for each row
  execute function public.set_default_slug();

-- 기존 행(트리거 추가 전에 만들어진 것)도 기본값 채워주고 not null로 잠근다.
update public.sites set slug = id::text where slug is null;

alter table public.sites alter column slug set not null;

-- DNS 서브도메인 라벨 규칙: 소문자/숫자/하이픈, 63자 이하, 하이픈으로 시작·끝 금지.
alter table public.sites add constraint sites_slug_format
  check (slug ~ '^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$');

create unique index sites_slug_key on public.sites (slug);

comment on column public.sites.slug is '{slug}.cornerpage.co에 쓰이는 공개 라우팅 식별자. 기본값은 id 복사, 유저가 나중에 변경 가능.';
