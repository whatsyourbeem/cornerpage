"use client";

import type { Faq } from "@/lib/content-types-boutique-fitness";
import { BlockCard, EditorField, RepeatableList, TextInput, TextareaInput } from "../fields";
import { createFaq, createFaqItem } from "../defaults";

export function FaqEditor({
  faq,
  onChange,
}: {
  faq: Faq | null;
  onChange: (next: Faq | null) => void;
}) {
  return (
    <BlockCard
      title="자주 묻는 질문"
      description="문의 전에 궁금해할 것들"
      enabled={faq !== null}
      onToggle={(next) => onChange(next ? createFaq() : null)}
    >
      {faq && (
        <RepeatableList
          items={faq.items}
          onChange={(items) => onChange({ items })}
          min={1}
          itemLabel="질문"
          createItem={createFaqItem}
          renderItem={(item, _index, onItemChange) => (
            <>
              <EditorField label="질문">
                <TextInput
                  value={item.question}
                  onChange={(next) => onItemChange({ ...item, question: next })}
                  placeholder="주차 되나요?"
                />
              </EditorField>
              <EditorField label="답변" hint="사실만 적어주세요.">
                <TextareaInput
                  value={item.answer}
                  onChange={(next) => onItemChange({ ...item, answer: next })}
                  rows={3}
                />
              </EditorField>
            </>
          )}
        />
      )}
    </BlockCard>
  );
}
