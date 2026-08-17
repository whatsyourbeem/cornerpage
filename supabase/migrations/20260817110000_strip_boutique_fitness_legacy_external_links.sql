-- boutique-fitness 사이트에 남아 있는 blocks.info.external_links를 제거한다.
--
-- 이 필드는 2026-07-17에 boutique-fitness 스키마에서 삭제됐다 —
-- meta.browse_channels(둘러보기 채널)와 완전히 중복이라, 스킬이 같은 판단을 두 번
-- 할 이유가 없어졌기 때문(spec/for-frontend/boutique-fitness/content.types.ts 주석).
-- 그런데 그 이전에 생성된 row에는 값이 그대로 남았다. 렌더러는 이 키를 아예 읽지
-- 않아서 사이트는 멀쩡히 보이지만, content.schema.json의 Info가
-- additionalProperties: false라 ajv 검증은 실패한다.
--
-- 지금까지는 생성 시점에만 검증해서 드러나지 않았는데, 관리/편집 화면이
-- 저장할 때마다 문서 전체를 다시 검증하면서 문제가 됐다 — 사장님이 상단바 문구만
-- 고쳐도 "매장 정보 — must NOT have additional properties"로 저장이 막힌다.
-- 편집기에 external_links 입력칸이 없으니 사장님 쪽에서 고칠 방법도 없다.
--
-- 스키마에서 사라진 필드를 데이터에서도 지우는 것이므로 정보 손실이 아니다.
update public.sites
set content_json = jsonb_set(
      content_json,
      '{blocks,info}',
      (content_json -> 'blocks' -> 'info') - 'external_links'
    )
where vertical = 'boutique-fitness'
  and content_json -> 'blocks' -> 'info' ? 'external_links';
