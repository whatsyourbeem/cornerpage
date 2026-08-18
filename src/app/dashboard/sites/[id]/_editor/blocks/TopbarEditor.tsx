"use client";

import type { Topbar } from "@/lib/content-types-boutique-fitness";
import { BlockCard, EditorField, TextInput } from "../fields";

export function TopbarEditor({
  topbar,
  onChange,
}: {
  topbar: Topbar;
  onChange: (next: Topbar) => void;
}) {
  return (
    <BlockCard title="상단바" description="화면 맨 위에 항상 떠 있는 줄">
      <EditorField label="표시 이름" hint="로고가 없으면 이 글자가 로고 자리에 나와요.">
        <TextInput value={topbar.display_name} onChange={(next) => onChange({ ...topbar, display_name: next })} />
      </EditorField>
      <EditorField label="버튼 문구" hint="누르면 문의 채널이 나와요.">
        <TextInput
          value={topbar.cta_label}
          onChange={(next) => onChange({ ...topbar, cta_label: next })}
          placeholder="문의하기"
        />
      </EditorField>
    </BlockCard>
  );
}
