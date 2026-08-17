"use client";

import type { HowItWorks } from "@/lib/content-types-boutique-fitness";
import { BlockCard, EditorField, RepeatableList, TextInput, TextareaInput } from "../fields";
import { createHowItWorks, createHowItWorksStep } from "../defaults";

export function HowItWorksEditor({
  howItWorks,
  onChange,
}: {
  howItWorks: HowItWorks | null;
  onChange: (next: HowItWorks | null) => void;
}) {
  return (
    <BlockCard
      title="이용 안내"
      description="처음 오는 사람이 밟는 순서 — 2~4단계"
      enabled={howItWorks !== null}
      onToggle={(next) => onChange(next ? createHowItWorks() : null)}
    >
      {howItWorks && (
        <RepeatableList
          items={howItWorks.steps}
          onChange={(steps) =>
            // order는 화면에 표시되는 단계 번호다 — 순서를 바꾸거나 중간을 지우면
            // 배열 위치와 어긋나므로 항상 현재 위치로 다시 매긴다.
            onChange({ steps: steps.map((step, index) => ({ ...step, order: index + 1 })) })
          }
          min={2}
          max={4}
          itemLabel="단계"
          createItem={() => createHowItWorksStep(howItWorks.steps.length + 1)}
          renderItem={(step, _index, onItemChange) => (
            <>
              <EditorField label="제목" hint="예: 상담, 체험 수업, 등록">
                <TextInput value={step.title} onChange={(next) => onItemChange({ ...step, title: next })} />
              </EditorField>
              <EditorField label="설명">
                <TextareaInput
                  value={step.description}
                  onChange={(next) => onItemChange({ ...step, description: next })}
                  rows={2}
                />
              </EditorField>
            </>
          )}
        />
      )}
    </BlockCard>
  );
}
