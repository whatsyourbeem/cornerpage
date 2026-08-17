"use client";

import type { Philosophy } from "@/lib/content-types-boutique-fitness";
import { BlockCard, EditorField, TextareaInput } from "../fields";
import { createPhilosophy } from "../defaults";

export function PhilosophyEditor({
  philosophy,
  onChange,
}: {
  philosophy: Philosophy | null;
  onChange: (next: Philosophy | null) => void;
}) {
  return (
    <BlockCard
      title="철학"
      description="이 공간을 시작한 이유 — 큰 글씨로 강조돼요"
      enabled={philosophy !== null}
      onToggle={(next) => onChange(next ? createPhilosophy() : null)}
    >
      {philosophy && (
        <EditorField label="내용" hint="개인의 지도 철학이 아니라 스튜디오를 시작한 계기를 적어주세요.">
          <TextareaInput value={philosophy.text} onChange={(text) => onChange({ text })} rows={4} />
        </EditorField>
      )}
    </BlockCard>
  );
}
