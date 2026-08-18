"use client";

import type { Reviews } from "@/lib/content-types-boutique-fitness";
import {
  BlockCard,
  EditorField,
  NullableTextInput,
  RepeatableList,
  TextInput,
  TextareaInput,
} from "../fields";
import { createReviewItem, createReviews } from "../defaults";

export function ReviewsEditor({
  reviews,
  onChange,
}: {
  reviews: Reviews | null;
  onChange: (next: Reviews | null) => void;
}) {
  return (
    <BlockCard
      title="후기"
      description="회원이 남긴 말 그대로"
      enabled={reviews !== null}
      onToggle={(next) => onChange(next ? createReviews() : null)}
    >
      {reviews && (
        <RepeatableList
          items={reviews.items}
          onChange={(items) => onChange({ items })}
          min={1}
          max={4}
          itemLabel="후기"
          createItem={createReviewItem}
          renderItem={(item, _index, onItemChange) => (
            <>
              <EditorField label="내용" hint="받은 후기를 고치지 말고 그대로 옮겨주세요.">
                <TextareaInput
                  value={item.body}
                  onChange={(next) => onItemChange({ ...item, body: next })}
                  rows={4}
                />
              </EditorField>

              <EditorField label="작성자" hint="예: 이○민님">
                <TextInput value={item.author} onChange={(next) => onItemChange({ ...item, author: next })} />
              </EditorField>

              <EditorField label="별점" hint="0~5. 없으면 비워두세요.">
                <TextInput
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={item.rating === null ? "" : String(item.rating)}
                  onChange={(next) =>
                    onItemChange({ ...item, rating: next.trim() === "" ? null : Number(next) })
                  }
                />
              </EditorField>

              <EditorField label="출처" hint="예: 네이버 플레이스(선택)">
                <NullableTextInput
                  value={item.source}
                  onChange={(next) => onItemChange({ ...item, source: next })}
                />
              </EditorField>

              <EditorField label="담당 강사" hint="후기에 실제로 언급된 경우에만(선택)">
                <NullableTextInput
                  value={item.trainer_tag}
                  onChange={(next) => onItemChange({ ...item, trainer_tag: next })}
                />
              </EditorField>
            </>
          )}
        />
      )}
    </BlockCard>
  );
}
