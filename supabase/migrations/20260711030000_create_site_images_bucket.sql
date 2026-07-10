-- 유저 업로드 이미지(대표사진/메뉴사진/로고 등) 저장용 공개 버킷.
-- public=true라 GET은 인증 없이 누구나 가능 — 방문자 전원이 봐야 하는
-- 공개 웹페이지 콘텐츠이기 때문. 업로드(INSERT)는 정책을 만들지 않는다 —
-- 백엔드 API가 service_role 키(RLS 우회)로만 올린다.
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;
