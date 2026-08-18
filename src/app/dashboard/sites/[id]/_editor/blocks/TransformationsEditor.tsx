"use client";

import type { Transformations } from "@/lib/content-types-boutique-fitness";
import {
  BlockCard,
  EditorField,
  NullableTextInput,
  RepeatableList,
  TextInput,
} from "../fields";
import { ImageField } from "../image-fields";
import { createTransformationItem, createTransformations } from "../defaults";

export function TransformationsEditor({
  siteId,
  transformations,
  onChange,
}: {
  siteId: string;
  transformations: Transformations | null;
  onChange: (next: Transformations | null) => void;
}) {
  return (
    <BlockCard
      title="변화 사례"
      description="비포·애프터로 보여주는 회원 변화"
      enabled={transformations !== null}
      onToggle={(next) => onChange(next ? createTransformations() : null)}
    >
      {transformations && (
        <RepeatableList
          items={transformations.items}
          onChange={(items) => onChange({ items })}
          min={1}
          max={4}
          itemLabel="사례"
          createItem={createTransformationItem}
          renderItem={(item, index, onItemChange) => (
            <>
              <EditorField label="비포·애프터 사진">
                <ImageField
                  siteId={siteId}
                  slot={`transformation-${index}`}
                  value={item.before_after_image_url === "" ? null : item.before_after_image_url}
                  onChange={(next) => onItemChange({ ...item, before_after_image_url: next ?? "" })}
                />
              </EditorField>

              <EditorField label="기간" hint="예: 3개월">
                <TextInput
                  value={item.duration_label}
                  onChange={(next) => onItemChange({ ...item, duration_label: next })}
                />
              </EditorField>

              <EditorField label="변화 요약" hint="예: 체중 8kg 감량, 허리 통증 개선">
                <TextInput
                  value={item.result_highlight}
                  onChange={(next) => onItemChange({ ...item, result_highlight: next })}
                />
              </EditorField>

              <EditorField label="회원 표기" hint="이름은 익명으로. 예: 김○영님">
                <TextInput
                  value={item.member_label}
                  onChange={(next) => onItemChange({ ...item, member_label: next })}
                />
              </EditorField>

              <EditorField label="담당 강사" hint="실제로 언급된 경우에만 적어주세요(선택).">
                <NullableTextInput
                  value={item.trainer_tag}
                  onChange={(next) => onItemChange({ ...item, trainer_tag: next })}
                />
              </EditorField>

              <EditorField label="설명" hint="선택. 이 사례에 대해 덧붙일 말이 있으면 적어주세요.">
                <NullableTextInput
                  value={item.description}
                  onChange={(next) => onItemChange({ ...item, description: next })}
                  multiline
                />
              </EditorField>
            </>
          )}
        />
      )}
    </BlockCard>
  );
}
