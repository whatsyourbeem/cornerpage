"use client";

import type { Menu, MenuMode } from "@/lib/content-types-boutique-fitness";
import {
  BlockCard,
  EditorField,
  NullableTextInput,
  RepeatableList,
  SelectInput,
  TextInput,
} from "../fields";
import { ImageField } from "../image-fields";
import { createMenuCategory, createMenuItem } from "../defaults";

const MODE_OPTIONS: { value: MenuMode; label: string }[] = [
  { value: "item_consult", label: "가격 비공개 (상담 문의)" },
  { value: "item_price", label: "항목별 가격 표시" },
  { value: "package_table", label: "패키지 표(회차별 가격)" },
];

/**
 * menu는 mode에 따라 items/categories가 상호 배타적으로 채워지는 판별 유니온이다
 * (스키마 if/then). 모드를 바꿀 때 두 필드를 함께 정리하지 않으면 — 예를 들어
 * package_table로 바꿔놓고 items를 그대로 두면 — 저장 시점에 ajv가 거부한다.
 * 그래서 모드 변경을 단순 필드 수정이 아니라 객체 재구성으로 처리한다.
 *
 * item_consult는 추가로 모든 price가 null이어야 한다 — 가격 칸을 숨기는 것만으로는
 * 부족하고(이전 모드에서 적어둔 값이 남는다) 전환 시 실제로 비운다.
 */
function switchMode(menu: Menu, mode: MenuMode): Menu {
  if (mode === "package_table") {
    return {
      label: menu.label,
      mode,
      items: null,
      categories: menu.categories ?? [createMenuCategory()],
      full_list_link_enabled: menu.full_list_link_enabled,
    };
  }

  const items = menu.items ?? [createMenuItem()];
  return {
    label: menu.label,
    mode,
    items: mode === "item_consult" ? items.map((item) => ({ ...item, price: null })) : items,
    categories: null,
    full_list_link_enabled: menu.full_list_link_enabled,
  };
}

export function MenuEditor({
  siteId,
  menu,
  onChange,
}: {
  siteId: string;
  menu: Menu;
  onChange: (next: Menu) => void;
}) {
  return (
    <BlockCard title="프로그램" description="수업·회원권 구성">
      <EditorField label="섹션 제목" hint="'메뉴' 대신 업종 말로. 예: PT 프로그램, 수업 구성">
        <TextInput value={menu.label} onChange={(next) => onChange({ ...menu, label: next })} />
      </EditorField>

      <EditorField label="표시 방식">
        <SelectInput
          value={menu.mode}
          onChange={(next) => onChange(switchMode(menu, next))}
          options={MODE_OPTIONS}
        />
      </EditorField>

      {menu.mode === "package_table" ? (
        <EditorField label="카테고리">
          <RepeatableList
            items={menu.categories}
            onChange={(categories) => onChange({ ...menu, categories })}
            min={1}
            itemLabel="카테고리"
            createItem={createMenuCategory}
            renderItem={(category, _index, onItemChange) => (
              <>
                <EditorField label="카테고리 이름" hint="예: 1:1 개인수업">
                  <TextInput
                    value={category.category_name}
                    onChange={(next) => onItemChange({ ...category, category_name: next })}
                  />
                </EditorField>

                <EditorField label="가격 단계" hint="예: 10회 · 60만원">
                  <RepeatableList
                    items={category.tiers}
                    onChange={(tiers) =>
                      onItemChange({
                        ...category,
                        tiers,
                        // 단계를 지우면 대표 단계 번호가 범위를 벗어날 수 있다.
                        representative_tier_index: Math.min(
                          category.representative_tier_index,
                          Math.max(tiers.length - 1, 0)
                        ),
                      })
                    }
                    min={1}
                    itemLabel="단계"
                    createItem={() => ({ label: "", price: "" })}
                    renderItem={(tier, _tierIndex, onTierChange) => (
                      <>
                        <EditorField label="회차·기간">
                          <TextInput
                            value={tier.label}
                            onChange={(next) => onTierChange({ ...tier, label: next })}
                            placeholder="10회"
                          />
                        </EditorField>
                        <EditorField label="가격">
                          <TextInput
                            value={tier.price}
                            onChange={(next) => onTierChange({ ...tier, price: next })}
                            placeholder="600,000원"
                          />
                        </EditorField>
                      </>
                    )}
                  />
                </EditorField>

                <EditorField label="대표로 보여줄 단계">
                  <SelectInput
                    value={String(category.representative_tier_index)}
                    onChange={(next) =>
                      onItemChange({ ...category, representative_tier_index: Number(next) })
                    }
                    options={category.tiers.map((tier, tierIndex) => ({
                      value: String(tierIndex),
                      label: tier.label.trim() === "" ? `${tierIndex + 1}번째 단계` : tier.label,
                    }))}
                  />
                </EditorField>
              </>
            )}
          />
        </EditorField>
      ) : (
        <EditorField label="항목">
          <RepeatableList
            items={menu.items}
            onChange={(items) => onChange({ ...menu, items })}
            min={1}
            itemLabel="항목"
            createItem={createMenuItem}
            renderItem={(item, index, onItemChange) => (
              <>
                <EditorField label="이름">
                  <TextInput
                    value={item.name}
                    onChange={(next) => onItemChange({ ...item, name: next })}
                    placeholder="1:1 개인 레슨"
                  />
                </EditorField>

                {menu.mode === "item_price" && (
                  <EditorField label="가격">
                    <NullableTextInput
                      value={item.price}
                      onChange={(next) => onItemChange({ ...item, price: next })}
                      placeholder="70,000원"
                    />
                  </EditorField>
                )}

                <EditorField label="설명" hint="선택">
                  <NullableTextInput
                    value={item.description}
                    onChange={(next) => onItemChange({ ...item, description: next })}
                    multiline
                  />
                </EditorField>

                <EditorField label="배지" hint="'인기' 같은 표시. 한두 개 항목에만(선택)">
                  <NullableTextInput
                    value={item.badge}
                    onChange={(next) => onItemChange({ ...item, badge: next })}
                  />
                </EditorField>

                <EditorField label="사진" hint="선택">
                  <ImageField
                    siteId={siteId}
                    slot={`menu-${index}`}
                    value={item.image_url}
                    onChange={(next) => onItemChange({ ...item, image_url: next })}
                  />
                </EditorField>
              </>
            )}
          />
        </EditorField>
      )}

      <label className="flex items-center gap-2 text-[13px] font-semibold text-cp-fg">
        <input
          type="checkbox"
          checked={menu.full_list_link_enabled}
          onChange={(e) => onChange({ ...menu, full_list_link_enabled: e.target.checked })}
        />
        전체 목록 보기 링크 표시
      </label>
    </BlockCard>
  );
}
