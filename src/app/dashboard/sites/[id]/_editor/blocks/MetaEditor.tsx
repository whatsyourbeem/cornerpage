"use client";

import type {
  BrowseChannel,
  BrowseChannelType,
  InquiryChannel,
  InquiryChannelType,
  LeadEmphasis,
  Meta,
} from "@/lib/content-types-boutique-fitness";
import { BlockCard, EditorField, RepeatableList, SelectInput, TextInput } from "../fields";
import { ImageField } from "../image-fields";
import { createInquiryChannel } from "../defaults";

const LEAD_EMPHASIS_OPTIONS: { value: string; label: string }[] = [
  { value: "transformations", label: "변화 사례" },
  { value: "reviews", label: "후기" },
  { value: "professionals", label: "강사진" },
  { value: "facility", label: "시설" },
  { value: "__default__", label: "특별히 없음(기본 순서)" },
];

const INQUIRY_TYPE_OPTIONS: { value: InquiryChannelType; label: string }[] = [
  { value: "call", label: "전화" },
  { value: "naver_reservation", label: "네이버 예약" },
  { value: "kakao", label: "카카오톡" },
  { value: "instagram_dm", label: "인스타그램 DM" },
  { value: "other", label: "기타" },
];

const BROWSE_TYPE_OPTIONS: { value: BrowseChannelType; label: string }[] = [
  { value: "kakao", label: "카카오톡" },
  { value: "naver_blog", label: "네이버 블로그" },
  { value: "instagram", label: "인스타그램" },
  { value: "youtube", label: "유튜브" },
  { value: "naver_map", label: "네이버 지도" },
  { value: "other", label: "기타" },
];

/**
 * 채널의 type과 other_label은 스키마 if/then으로 묶여 있다 — "기타"일 때만
 * other_label에 값이 있어야 하고 나머지는 반드시 null이다. 유형을 바꿀 때
 * other_label을 같이 정리하지 않으면 저장 시점에야 알 수 없는 오류로 튕긴다.
 */
function withChannelType<T extends InquiryChannel | BrowseChannel>(channel: T, type: string): T {
  return {
    ...channel,
    type,
    other_label: type === "other" ? (channel.other_label ?? "") : null,
  } as T;
}

export function MetaEditor({
  siteId,
  meta,
  onChange,
}: {
  siteId: string;
  meta: Meta;
  onChange: (next: Meta) => void;
}) {
  const set = <K extends keyof Meta>(key: K, value: Meta[K]) => onChange({ ...meta, [key]: value });

  return (
    <BlockCard title="기본 정보" description="상호·로고·브랜드 컬러와 문의 채널" defaultOpen>
      <EditorField label="상호">
        <TextInput value={meta.business_name} onChange={(next) => set("business_name", next)} />
      </EditorField>

      <EditorField label="업종" hint="예: 필라테스 스튜디오, PT 전문 짐">
        <TextInput value={meta.industry_category} onChange={(next) => set("industry_category", next)} />
      </EditorField>

      <EditorField
        label="가장 내세우고 싶은 것"
        hint="홈페이지에서 어떤 내용을 먼저 보여줄지 정해져요."
      >
        <SelectInput
          value={meta.lead_emphasis ?? "__default__"}
          onChange={(next) =>
            set("lead_emphasis", (next === "__default__" ? null : next) as LeadEmphasis)
          }
          options={LEAD_EMPHASIS_OPTIONS}
        />
      </EditorField>

      <EditorField label="로고" hint="없으면 상호가 글자로 표시돼요.">
        <ImageField siteId={siteId} slot="logo" value={meta.logo_url} onChange={(next) => set("logo_url", next)} />
      </EditorField>

      <EditorField label="브랜드 컬러" hint="비워두면 기본 색을 써요.">
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={meta.brand_color ?? "#000000"}
            onChange={(e) => set("brand_color", e.target.value.toUpperCase())}
            className="h-10 w-14 flex-none cursor-pointer rounded-cp-sm border border-cp-border bg-cp-canvas"
            aria-label="브랜드 컬러 선택"
          />
          <TextInput
            value={meta.brand_color ?? ""}
            onChange={(next) => set("brand_color", next.trim() === "" ? null : next.toUpperCase())}
            placeholder="#4A9FD8"
          />
          {meta.brand_color && (
            <button
              type="button"
              onClick={() => set("brand_color", null)}
              className="flex-none text-[12px] font-semibold text-cp-muted hover:text-cp-body"
            >
              지우기
            </button>
          )}
        </div>
      </EditorField>

      <EditorField
        label="문의 채널"
        hint="문의하기 버튼을 누르면 여기 넣은 채널이 나와요. 최소 1개는 있어야 해요."
      >
        <RepeatableList
          items={meta.inquiry_channels}
          onChange={(next) => set("inquiry_channels", next)}
          min={1}
          itemLabel="문의 채널"
          createItem={createInquiryChannel}
          renderItem={(channel, _index, onItemChange) => (
            <>
              <EditorField label="유형">
                <SelectInput
                  value={channel.type}
                  onChange={(next) => onItemChange(withChannelType(channel, next))}
                  options={INQUIRY_TYPE_OPTIONS}
                />
              </EditorField>
              <EditorField label="연결 값" hint="전화번호 또는 링크 주소">
                <TextInput
                  value={channel.action_value}
                  onChange={(next) => onItemChange({ ...channel, action_value: next })}
                  placeholder="010-0000-0000"
                />
              </EditorField>
              {channel.type === "other" && (
                <EditorField label="채널 이름" hint="버튼에 표시될 이름이에요.">
                  <TextInput
                    value={channel.other_label ?? ""}
                    onChange={(next) =>
                      onItemChange({ ...channel, type: "other", other_label: next } as InquiryChannel)
                    }
                  />
                </EditorField>
              )}
            </>
          )}
        />
      </EditorField>

      <EditorField label="둘러보기 채널" hint="블로그·인스타그램처럼 구경할 수 있는 곳(선택)">
        <RepeatableList
          items={meta.browse_channels ?? []}
          onChange={(next) => set("browse_channels", next.length === 0 ? null : next)}
          itemLabel="둘러보기 채널"
          createItem={() => ({ type: "instagram", action_value: "", other_label: null }) as BrowseChannel}
          renderItem={(channel, _index, onItemChange) => (
            <>
              <EditorField label="유형">
                <SelectInput
                  value={channel.type}
                  onChange={(next) => onItemChange(withChannelType(channel, next))}
                  options={BROWSE_TYPE_OPTIONS}
                />
              </EditorField>
              <EditorField label="링크 주소">
                <TextInput
                  value={channel.action_value}
                  onChange={(next) => onItemChange({ ...channel, action_value: next })}
                  placeholder="https://"
                />
              </EditorField>
              {channel.type === "other" && (
                <EditorField label="채널 이름">
                  <TextInput
                    value={channel.other_label ?? ""}
                    onChange={(next) =>
                      onItemChange({ ...channel, type: "other", other_label: next } as BrowseChannel)
                    }
                  />
                </EditorField>
              )}
            </>
          )}
        />
      </EditorField>
    </BlockCard>
  );
}
