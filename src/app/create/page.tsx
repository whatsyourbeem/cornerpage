"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VERTICALS, type Vertical } from "@/lib/verticals";
import { Button, ChoiceCard } from "@/components/ui";

/**
 * /create의 첫 화면 — vertical(업종 대분류) 선택만 담당한다. 고른 뒤 "다음"을
 * 누르면 실제 입력 폼은 vertical별 라우트(/create/general, /create/boutique-fitness)로
 * 넘어간다 — general과 boutique-fitness는 질문 흐름·수집 데이터 모양이 완전히
 * 달라서(spec/for-frontend/{vertical}/input-questions.md), 한 컴포넌트 안에서
 * 분기하는 대신 라우트 자체를 분리했다.
 */
const VERTICAL_LABELS: Record<Vertical, { label: string; desc: string }> = {
  general: { label: "일반 업종", desc: "카페·미용실·네일샵·헬스장·학원·병의원 등" },
  "boutique-fitness": {
    label: "PT·필라테스·요가 스튜디오",
    desc: "1:1 또는 소수정예로 지도하는 트레이너 주도형 공간(대형 회원제 헬스장 제외)",
  },
};

export default function CreatePage() {
  const router = useRouter();
  const [vertical, setVertical] = useState<Vertical | null>(null);

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 py-10">
      <p className="mb-1 text-[13px] font-semibold text-cp-muted">약 3분이면 충분해요</p>
      <h1 className="mb-6 text-cp-h3 font-bold text-cp-fg">어떤 업종이세요?</h1>

      <div className="flex flex-col gap-3">
        {VERTICALS.map((v) => (
          <ChoiceCard
            key={v}
            selected={vertical === v}
            onClick={() => setVertical(v)}
            title={VERTICAL_LABELS[v].label}
            description={VERTICAL_LABELS[v].desc}
          />
        ))}
      </div>

      <Button size="xl" fullWidth disabled={!vertical} onClick={() => router.push(`/create/${vertical}`)} className="mt-8">
        다음
      </Button>
    </main>
  );
}
