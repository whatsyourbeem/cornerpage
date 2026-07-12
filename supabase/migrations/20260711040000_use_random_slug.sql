-- slug 기본값을 uuid 전체 복사 대신 20자리 무작위 문자열로 변경한다.
-- uuid(36자)는 서브도메인 URL로 쓰기엔 너무 길다 — {slug}.cornerpage.co에서
-- slug 부분만 짧게 줄인다. hex 인코딩은 소문자/숫자만 나오므로 기존
-- sites_slug_format 체크(DNS 라벨 규칙)를 별도 처리 없이 항상 만족한다.
--
-- 20자리 hex = 80비트 무작위성이라 충돌 확률은 사실상 0에 가깝지만,
-- unique 제약을 신뢰하기보다 트리거에서 직접 충돌을 검사해 재시도하는
-- 방식으로 "겹치면 안 된다"는 요구를 확률이 아니라 로직으로 보장한다.

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
      candidate := substring(encode(gen_random_bytes(15), 'hex'), 1, 20);
      exit when not exists (select 1 from public.sites where slug = candidate);
    end loop;
    new.slug := candidate;
  end if;
  return new;
end;
$$;

comment on function public.set_default_slug() is '신규 row의 slug가 null이면 기존 값과 겹치지 않는 20자리 무작위 hex 문자열로 채운다.';
