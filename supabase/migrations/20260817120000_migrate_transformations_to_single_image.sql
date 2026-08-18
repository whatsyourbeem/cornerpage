-- 변화 사례(transformations) 항목을 before_image_url + after_image_url 두 장에서
-- before_after_image_url 한 장 구조로 옮긴다.
--
-- 스키마·렌더러는 2026-08-16(커밋 a544195)에 이미 바뀌었다 — 사업자 대부분이 이미
-- 하나로 합쳐둔 비포/애프터 사진을 갖고 있어서 좌우 드래그 슬라이더를 폐기하고
-- 단일 합성 이미지 + description으로 재설계했다. 그런데 그때 기존 row를 옮기는
-- 마이그레이션이 없었다. 결과:
--   1. 렌더러가 item.before_after_image_url을 읽는데 값이 없어서, 기존 사이트의
--      변화 사례 사진이 전부 회색 폴백으로 나오고 있다(Transformations.tsx).
--   2. content.schema.json의 TransformationItem이 before_after_image_url을 필수로,
--      additionalProperties: false로 두고 있어 관리/편집 화면에서 저장이 아예 막힌다.
--
-- 두 장을 한 장으로 자동 합성할 수는 없으므로 after 사진을 승격한다 — 사진이
-- 아예 없는 것보다 결과 사진이라도 보이는 쪽이 낫고, 사장님이 관리 화면에서
-- 합성 이미지로 직접 교체할 수 있다. 기간·변화 요약·회원 표기 같은 텍스트는
-- 전부 그대로 보존된다.
update public.sites s
set content_json = jsonb_set(
      s.content_json,
      '{blocks,transformations,items}',
      (
        select jsonb_agg(
                 (item - 'before_image_url' - 'after_image_url')
                 || jsonb_build_object(
                      -- after가 없는 예외적인 row는 before라도 살린다.
                      'before_after_image_url',
                      coalesce(item -> 'after_image_url', item -> 'before_image_url'),
                      -- description은 필수 키지만 null 가능 — 없던 row엔 null을 채워 넣는다.
                      'description',
                      coalesce(item -> 'description', 'null'::jsonb)
                    )
                 order by ord
               )
        from jsonb_array_elements(s.content_json -> 'blocks' -> 'transformations' -> 'items')
             with ordinality as t(item, ord)
      )
    )
where s.vertical = 'boutique-fitness'
  and jsonb_typeof(s.content_json -> 'blocks' -> 'transformations') = 'object'
  and exists (
    select 1
    from jsonb_array_elements(s.content_json -> 'blocks' -> 'transformations' -> 'items') i
    where i ? 'after_image_url' or i ? 'before_image_url'
  );
