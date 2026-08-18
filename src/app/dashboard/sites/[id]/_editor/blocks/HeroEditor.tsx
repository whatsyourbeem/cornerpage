"use client";

import type { Hero } from "@/lib/content-types-boutique-fitness";
import { BlockCard, EditorField, TextInput, TextareaInput } from "../fields";
import { ImageListField } from "../image-fields";

/**
 * 스키마의 headline 패턴 `^.{4,20}(\n.{4,20})?$`를 사람이 읽을 수 있는 안내로 바꾼다.
 * 이 제약이 존재하는 이유는 길이 제한 자체가 아니라 줄바꿈 위치다 — 20자 넘는 문장을
 * 한 줄로 넣으면 브라우저가 아무 데서나 끊어버리니, 의미 단위로 직접 끊게 한다.
 */
function headlineError(value: string): string | null {
  const lines = value.split("\n");
  if (lines.length > 2) return "두 줄까지만 쓸 수 있어요.";
  const badIndex = lines.findIndex((line) => line.length < 4 || line.length > 20);
  if (badIndex >= 0) {
    return `${badIndex + 1}번째 줄은 4~20자로 써주세요 (지금 ${lines[badIndex].length}자).`;
  }
  return null;
}

export function HeroEditor({
  siteId,
  hero,
  onChange,
}: {
  siteId: string;
  hero: Hero;
  onChange: (next: Hero) => void;
}) {
  const set = <K extends keyof Hero>(key: K, value: Hero[K]) => onChange({ ...hero, [key]: value });
  const error = headlineError(hero.headline);
  const lines = hero.headline.split("\n");

  return (
    <BlockCard title="히어로" description="홈페이지를 열면 가장 먼저 보이는 화면">
      <EditorField label="배지" hint="헤드라인 위에 작게 붙는 한마디">
        <TextInput value={hero.badge} onChange={(next) => set("badge", next)} placeholder="재활 전문 8년" />
      </EditorField>

      <EditorField
        label="헤드라인"
        hint="한 줄에 4~20자, 최대 두 줄. 엔터로 줄을 나눠주세요."
        error={error ?? undefined}
      >
        <TextareaInput
          value={hero.headline}
          onChange={(next) => set("headline", next)}
          rows={2}
          invalid={error !== null}
          placeholder={"8년째 재활 전문으로,\n한 사람만 보는 PT"}
        />
        <span className="text-[12px] text-cp-muted">
          {lines.map((line, index) => `${index + 1}번째 줄 ${line.length}자`).join(" · ")}
        </span>
      </EditorField>

      <EditorField label="한 줄 설명" hint="'나도 할 수 있을까' 하는 걱정을 덜어주는 자리예요.">
        <TextareaInput value={hero.tagline} onChange={(next) => set("tagline", next)} rows={2} />
      </EditorField>

      <EditorField label="배경 사진" hint="여러 장 넣으면 순서대로 넘어가요. 최대 5장.">
        <ImageListField
          siteId={siteId}
          slot="hero"
          value={hero.background_images ?? []}
          onChange={(next) => set("background_images", next.length === 0 ? null : next)}
          max={5}
        />
      </EditorField>

      <EditorField label="버튼 문구" hint="누르면 문의 채널이 나와요.">
        <TextInput value={hero.cta_label} onChange={(next) => set("cta_label", next)} placeholder="상담 문의하기" />
      </EditorField>
    </BlockCard>
  );
}
