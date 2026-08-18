"use client";

import type { Professionals } from "@/lib/content-types-boutique-fitness";
import {
  BlockCard,
  EditorField,
  RepeatableList,
  TextInput,
  TextareaInput,
} from "../fields";
import { ImageField } from "../image-fields";
import { createProfessionalItem } from "../defaults";

/**
 * 이 vertical의 필수 블록 — general의 선택 블록들과 달리 null이 될 수 없어서
 * 사용 여부 스위치를 붙이지 않는다(끄면 사이트가 스키마를 위반한다).
 */
export function ProfessionalsEditor({
  siteId,
  professionals,
  onChange,
}: {
  siteId: string;
  professionals: Professionals;
  onChange: (next: Professionals) => void;
}) {
  return (
    <BlockCard title="강사진" description="누가 가르치는지 — 이 업종에서 가장 중요한 블록">
      <EditorField label="섹션 제목" hint="예: 트레이너 소개, 강사진 소개">
        <TextInput
          value={professionals.section_label}
          onChange={(next) => onChange({ ...professionals, section_label: next })}
        />
      </EditorField>

      <RepeatableList
        items={professionals.items}
        onChange={(items) => onChange({ ...professionals, items })}
        min={1}
        itemLabel="강사"
        createItem={createProfessionalItem}
        renderItem={(item, index, onItemChange) => (
          <>
            <EditorField label="사진">
              <ImageField
                siteId={siteId}
                slot={`professional-${index}`}
                value={item.photo_url}
                onChange={(next) => onItemChange({ ...item, photo_url: next })}
              />
            </EditorField>

            <EditorField label="이름">
              <TextInput value={item.name} onChange={(next) => onItemChange({ ...item, name: next })} />
            </EditorField>

            <EditorField label="직함" hint="예: 대표 트레이너, 원장">
              <TextInput value={item.title} onChange={(next) => onItemChange({ ...item, title: next })} />
            </EditorField>

            <EditorField label="전문 분야" hint="예: 산전·산후 재활">
              <TextInput
                value={item.specialty}
                onChange={(next) => onItemChange({ ...item, specialty: next })}
              />
            </EditorField>

            <EditorField label="경력(년)" hint="숫자만. 없으면 비워두세요.">
              <TextInput
                type="number"
                min={0}
                value={item.years_experience === null ? "" : String(item.years_experience)}
                onChange={(next) =>
                  onItemChange({
                    ...item,
                    years_experience: next.trim() === "" ? null : Number(next),
                  })
                }
              />
            </EditorField>

            <EditorField label="한 줄 소개" hint="과장 없이, 어떻게 가르치는지 한 문장으로.">
              <TextareaInput
                value={item.bio_quote}
                onChange={(next) => onItemChange({ ...item, bio_quote: next })}
                rows={2}
              />
            </EditorField>

            <EditorField label="자격·이력" hint="실제로 가진 것만 적어주세요.">
              <RepeatableList
                items={item.certifications}
                onChange={(certifications) => onItemChange({ ...item, certifications })}
                itemLabel="자격"
                createItem={() => ""}
                renderItem={(certification, _certIndex, onCertChange) => (
                  <TextInput
                    value={certification}
                    onChange={onCertChange}
                    placeholder="예: 생활스포츠지도사 2급"
                  />
                )}
              />
            </EditorField>
          </>
        )}
      />
    </BlockCard>
  );
}
