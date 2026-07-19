import type { DayOfWeek, HoursStructuredEntry } from "./content-types-boutique-fitness";

const DAY_ORDER: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABEL: Record<DayOfWeek, string> = {
  mon: "월",
  tue: "화",
  wed: "수",
  thu: "목",
  fri: "금",
  sat: "토",
  sun: "일",
};

/** 입력된 요일만, 요일 순서(월~일)로 정렬해 반환 */
export function sortStructuredHours(entries: HoursStructuredEntry[]): HoursStructuredEntry[] {
  return [...entries].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));
}

export function dayLabel(day: DayOfWeek): string {
  return DAY_LABEL[day];
}

export function formatHoursLine(entry: HoursStructuredEntry): string {
  if (entry.closed) return "휴무";
  const range = entry.open && entry.close ? `${entry.open}–${entry.close}` : "-";
  const extras: string[] = [];
  if (entry.break) extras.push(`브레이크 ${entry.break[0]}–${entry.break[1]}`);
  if (entry.last_order) extras.push(`라스트오더 ${entry.last_order}`);
  return extras.length ? `${range} (${extras.join(", ")})` : range;
}
