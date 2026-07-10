-- get_advisors(security) 경고 대응: search_path가 고정되지 않은 함수는
-- 권한 상승에 악용될 수 있다. now()는 pg_catalog 내장 함수라 search_path를
-- 비워도 정상 동작한다.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
