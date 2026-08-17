"use client";

import type { Gallery } from "@/lib/content-types-boutique-fitness";
import { BlockCard, EditorField, NullableTextInput } from "../fields";
import { ImageListField } from "../image-fields";
import { createGallery } from "../defaults";

export function GalleryEditor({
  siteId,
  gallery,
  onChange,
}: {
  siteId: string;
  gallery: Gallery | null;
  onChange: (next: Gallery | null) => void;
}) {
  return (
    <BlockCard
      title="갤러리"
      description="공간 분위기 사진"
      enabled={gallery !== null}
      onToggle={(next) => onChange(next ? createGallery() : null)}
    >
      {gallery && (
        <>
          <EditorField
            label="사진"
            hint="강사진·시설·변화 사례에 쓴 사진은 빼고, 분위기 사진만 넣어주세요. 최소 1장."
          >
            <ImageListField
              siteId={siteId}
              slot="gallery"
              value={gallery.images}
              onChange={(images) => onChange({ ...gallery, images })}
            />
          </EditorField>

          <EditorField label="더보기 링크" hint="사진이 더 있는 곳 주소(선택)">
            <NullableTextInput
              value={gallery.more_link_url}
              onChange={(more_link_url) => onChange({ ...gallery, more_link_url })}
              placeholder="https://"
            />
          </EditorField>
        </>
      )}
    </BlockCard>
  );
}
