-- set_default_slug()가 20260710101500과 같은 보안 패턴(search_path = '')을
-- 쓰면서, gen_random_bytes()를 스키마 접두사 없이 불렀다. pgcrypto는
-- extensions 스키마에 설치돼 있는데 search_path가 비어있으니 함수를 못 찾아
-- "function gen_random_bytes(integer) does not exist"로 slug 없는 모든
-- insert(=/api/sites의 실제 생성 경로 전부)가 막혀 있었다. extensions.를
-- 명시해서 고친다 — search_path를 다시 여는 대신(권한 상승 위험 재도입)
-- 호출부만 완전히 정규화한다.
create or replace function public.set_default_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  candidate text;
begin
  if new.slug is null then
    loop
      candidate := substring(encode(extensions.gen_random_bytes(15), 'hex'), 1, 20);
      exit when not exists (select 1 from public.sites where slug = candidate);
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;
