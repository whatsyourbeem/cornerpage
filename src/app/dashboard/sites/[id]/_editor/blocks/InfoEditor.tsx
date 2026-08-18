"use client";

import type {
  DayOfWeek,
  HoursStructuredEntry,
  Info,
} from "@/lib/content-types-boutique-fitness";
import { BlockCard, EditorField, NullableTextInput, TextInput } from "../fields";

const DAYS: { key: DayOfWeek; label: string }[] = [
  { key: "mon", label: "월" },
  { key: "tue", label: "화" },
  { key: "wed", label: "수" },
  { key: "thu", label: "목" },
  { key: "fri", label: "금" },
  { key: "sat", label: "토" },
  { key: "sun", label: "일" },
];

function defaultEntries(): HoursStructuredEntry[] {
  return DAYS.map(({ key }) => ({
    day: key,
    open: "09:00",
    close: "21:00",
    break: null,
    last_order: null,
    closed: false,
  }));
}

const TIME_INPUT_CLASS =
  "h-9 w-[116px] flex-none rounded-cp-sm border border-cp-border px-2 text-[13px] text-cp-fg outline-none focus:border-cp-primary";

export function InfoEditor({ info, onChange }: { info: Info; onChange: (next: Info) => void }) {
  const set = <K extends keyof Info>(key: K, value: Info[K]) => onChange({ ...info, [key]: value });

  const entries = info.hours.type === "structured" ? info.hours.structured : [];

  function setEntry(index: number, next: HoursStructuredEntry) {
    onChange({
      ...info,
      hours: { type: "structured", structured: entries.map((e, i) => (i === index ? next : e)) },
    });
  }

  return (
    <BlockCard title="매장 정보" description="주소·영업시간·연락처">
      <EditorField
        label="주소"
        hint="주소를 바꾸면 지도 위치도 함께 다시 잡혀요."
      >
        <TextInput value={info.address} onChange={(next) => set("address", next)} />
      </EditorField>

      <EditorField label="찾아오는 길" hint="예: 시청 사거리에서 도보 5분(선택)">
        <NullableTextInput
          value={info.landmark_distance}
          onChange={(next) => set("landmark_distance", next)}
        />
      </EditorField>

      <EditorField label="전화번호">
        <TextInput value={info.phone} onChange={(next) => set("phone", next)} placeholder="010-0000-0000" />
      </EditorField>

      <EditorField label="영업시간">
        <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-cp-fg">
          <input
            type="checkbox"
            checked={info.hours.type === "24h"}
            onChange={(e) =>
              set(
                "hours",
                e.target.checked
                  ? { type: "24h", structured: null }
                  : { type: "structured", structured: defaultEntries() }
              )
            }
          />
          24시간 운영
        </label>

        {info.hours.type === "structured" && (
          <div className="flex flex-col gap-2">
            {entries.map((entry, index) => (
              <div key={entry.day} className="flex flex-wrap items-center gap-2 text-[14px]">
                <span className="w-5 flex-none font-bold text-cp-fg">
                  {DAYS.find((d) => d.key === entry.day)?.label ?? entry.day}
                </span>
                <label className="flex items-center gap-1.5 text-[13px] text-cp-body">
                  <input
                    type="checkbox"
                    checked={entry.closed}
                    onChange={(e) =>
                      setEntry(index, {
                        ...entry,
                        closed: e.target.checked,
                        // 휴무일에 시간이 남아 있으면 렌더러가 "휴무 09:00-21:00"처럼
                        // 모순된 표시를 하게 된다.
                        open: e.target.checked ? null : (entry.open ?? "09:00"),
                        close: e.target.checked ? null : (entry.close ?? "21:00"),
                        break: e.target.checked ? null : entry.break,
                        last_order: e.target.checked ? null : entry.last_order,
                      })
                    }
                  />
                  휴무
                </label>

                {!entry.closed && (
                  <>
                    <input
                      type="time"
                      value={entry.open ?? ""}
                      onChange={(e) => setEntry(index, { ...entry, open: e.target.value || null })}
                      className={TIME_INPUT_CLASS}
                      aria-label="여는 시간"
                    />
                    <span className="text-cp-muted">–</span>
                    <input
                      type="time"
                      value={entry.close ?? ""}
                      onChange={(e) => setEntry(index, { ...entry, close: e.target.value || null })}
                      className={TIME_INPUT_CLASS}
                      aria-label="닫는 시간"
                    />
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </EditorField>

      <EditorField label="사업자 정보" hint="홈페이지 맨 아래에 작게 표시돼요.">
        <label className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-cp-fg">
          <input
            type="checkbox"
            checked={info.business_info !== null}
            onChange={(e) =>
              set(
                "business_info",
                e.target.checked
                  ? { registered_name: "", ceo_name: "", registration_number: "" }
                  : null
              )
            }
          />
          사업자 정보 표시
        </label>

        {info.business_info && (
          <div className="flex flex-col gap-3">
            <EditorField label="상호(사업자등록상)">
              <TextInput
                value={info.business_info.registered_name}
                onChange={(next) =>
                  set("business_info", { ...info.business_info!, registered_name: next })
                }
              />
            </EditorField>
            <EditorField label="대표자">
              <TextInput
                value={info.business_info.ceo_name}
                onChange={(next) => set("business_info", { ...info.business_info!, ceo_name: next })}
              />
            </EditorField>
            <EditorField label="사업자등록번호">
              <TextInput
                value={info.business_info.registration_number}
                onChange={(next) =>
                  set("business_info", { ...info.business_info!, registration_number: next })
                }
              />
            </EditorField>
          </div>
        )}
      </EditorField>
    </BlockCard>
  );
}
