"use client";

import type { StickyCta } from "@/lib/content-types-boutique-fitness";
import { BlockCard, EditorField, TextInput } from "../fields";

export function StickyCtaEditor({
  stickyCta,
  onChange,
}: {
  stickyCta: StickyCta;
  onChange: (next: StickyCta) => void;
}) {
  return (
    <BlockCard title="하단 버튼" description="스크롤하면 화면 아래에 떠 있는 버튼">
      <EditorField label="버튼 문구" hint="누르면 문의 채널이 나와요.">
        <TextInput
          value={stickyCta.cta_label}
          onChange={(next) => onChange({ cta_label: next })}
          placeholder="상담 문의"
        />
      </EditorField>
    </BlockCard>
  );
}
