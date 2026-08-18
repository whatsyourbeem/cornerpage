"use client";

import {
  Award,
  BadgeCheck,
  Calendar,
  Clock,
  Dumbbell,
  Heart,
  MessagesSquare,
  RefreshCw,
  Star,
  TrendingUp,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import type {
  TrustStrip,
  TrustStripIcon,
  TrustStripItem,
} from "@/lib/content-types-boutique-fitness";
import { cx } from "@/components/ui";
import { BlockCard, EditorField, TextInput } from "../fields";

/**
 * 렌더러(TrustStrip.tsx)의 TRUST_STRIP_ICONS와 같은 12개 목록. 아이콘 이름을 글자로
 * 고르게 하면(select) 사장님은 무슨 그림인지 알 수 없어서, 실제 아이콘을 그려놓고 고르게 한다.
 */
const ICONS: { key: TrustStripIcon; Icon: LucideIcon }[] = [
  { key: "Calendar", Icon: Calendar },
  { key: "Clock", Icon: Clock },
  { key: "Users", Icon: Users },
  { key: "Award", Icon: Award },
  { key: "BadgeCheck", Icon: BadgeCheck },
  { key: "TrendingUp", Icon: TrendingUp },
  { key: "RefreshCw", Icon: RefreshCw },
  { key: "Heart", Icon: Heart },
  { key: "Star", Icon: Star },
  { key: "Dumbbell", Icon: Dumbbell },
  { key: "MessagesSquare", Icon: MessagesSquare },
  { key: "Trophy", Icon: Trophy },
];

/**
 * 신뢰 지표는 스키마상 정확히 3개다(minItems·maxItems 모두 3) — 추가·삭제 없이
 * 세 칸의 값만 고친다. RepeatableList를 쓰지 않는 유일한 목록 블록.
 */
export function TrustStripEditor({
  trustStrip,
  onChange,
}: {
  trustStrip: TrustStrip;
  onChange: (next: TrustStrip) => void;
}) {
  function setItem(index: number, next: TrustStripItem) {
    const items = trustStrip.items.map((item, i) => (i === index ? next : item)) as TrustStrip["items"];
    onChange({ items });
  }

  return (
    <BlockCard title="신뢰 지표" description="숫자 세 개로 보여주는 강점">
      {trustStrip.items.map((item, index) => (
        <div key={index} className="flex flex-col gap-3 rounded-cp-md border border-cp-border px-3 py-3">
          <span className="text-[12px] font-bold text-cp-body">{index + 1}번째</span>

          <EditorField label="값" hint="예: 8년, 1,240+, 4.9">
            <TextInput value={item.value} onChange={(next) => setItem(index, { ...item, value: next })} />
          </EditorField>

          <EditorField label="이름" hint="예: 운영 연차, 누적 회원, 평균 평점">
            <TextInput value={item.label} onChange={(next) => setItem(index, { ...item, label: next })} />
          </EditorField>

          <EditorField label="아이콘">
            <div className="flex flex-wrap gap-1.5">
              {ICONS.map(({ key, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setItem(index, { ...item, icon: key })}
                  aria-label={key}
                  aria-pressed={item.icon === key}
                  className={cx(
                    "flex h-9 w-9 items-center justify-center rounded-cp-sm border transition-colors",
                    item.icon === key
                      ? "border-cp-primary bg-cp-weak-bg text-cp-weak-fg"
                      : "border-cp-border bg-cp-canvas text-cp-body hover:bg-cp-surface"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </button>
              ))}
            </div>
          </EditorField>
        </div>
      ))}
    </BlockCard>
  );
}
