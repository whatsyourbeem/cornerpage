"use client";

import type { Facility } from "@/lib/content-types-boutique-fitness";
import {
  BlockCard,
  EditorField,
  NullableTextInput,
  RepeatableList,
  TextInput,
  TriStateInput,
} from "../fields";
import { ImageListField } from "../image-fields";
import { createFacility } from "../defaults";

export function FacilityEditor({
  siteId,
  facility,
  onChange,
}: {
  siteId: string;
  facility: Facility | null;
  onChange: (next: Facility | null) => void;
}) {
  const set = <K extends keyof Facility>(key: K, value: Facility[K]) =>
    facility && onChange({ ...facility, [key]: value });

  return (
    <BlockCard
      title="시설"
      description="공간 규모·장비·편의시설"
      enabled={facility !== null}
      onToggle={(next) => onChange(next ? createFacility() : null)}
    >
      {facility && (
        <>
          <EditorField label="규모(평)" hint="숫자만. 없으면 비워두세요.">
            <TextInput
              type="number"
              min={0}
              value={facility.size_pyeong === null ? "" : String(facility.size_pyeong)}
              onChange={(next) => set("size_pyeong", next.trim() === "" ? null : Number(next))}
            />
          </EditorField>

          <EditorField label="샤워실">
            <TriStateInput value={facility.has_shower} onChange={(next) => set("has_shower", next)} />
          </EditorField>

          <EditorField label="락커">
            <TriStateInput value={facility.has_locker} onChange={(next) => set("has_locker", next)} />
          </EditorField>

          <EditorField label="주차">
            <TriStateInput value={facility.has_parking} onChange={(next) => set("has_parking", next)} />
          </EditorField>

          <EditorField label="장비" hint="수량까지 함께. 예: 리포머 5대">
            <RepeatableList
              items={facility.equipment_list ?? []}
              onChange={(next) => set("equipment_list", next.length === 0 ? null : next)}
              itemLabel="장비"
              createItem={() => ""}
              renderItem={(equipment, _index, onItemChange) => (
                <TextInput value={equipment} onChange={onItemChange} placeholder="리포머 5대" />
              )}
            />
          </EditorField>

          <EditorField label="시설 사진" hint="갤러리와 겹치지 않게, 시설을 보여주는 사진만.">
            <ImageListField
              siteId={siteId}
              slot="facility"
              value={facility.photos ?? []}
              onChange={(next) => set("photos", next.length === 0 ? null : next)}
            />
          </EditorField>

          <EditorField label="분위기 설명" hint="조용함·햇빛·소리처럼 공간에서 느껴지는 것(선택)">
            <NullableTextInput
              value={facility.atmosphere_text}
              onChange={(next) => set("atmosphere_text", next)}
              multiline
            />
          </EditorField>
        </>
      )}
    </BlockCard>
  );
}
