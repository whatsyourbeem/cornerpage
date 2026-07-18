"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VERTICALS, type Vertical } from "@/lib/verticals";
import { Section, Field, navButtonStyle, primaryButtonStyle } from "./_shared/form-ui";

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
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Section title="어떤 업종이세요?">
        <Field label="업종 카테고리">
          <select
            value={vertical ?? ""}
            onChange={(e) => setVertical((e.target.value || null) as Vertical | null)}
            autoFocus
          >
            <option value="" disabled>
              선택해주세요
            </option>
            {VERTICALS.map((v) => (
              <option key={v} value={v}>
                {VERTICAL_LABELS[v].label}
              </option>
            ))}
          </select>
        </Field>
        {vertical && <p style={{ fontSize: 12, color: "#888" }}>{VERTICAL_LABELS[vertical].desc}</p>}
      </Section>

      <div style={{ display: "flex", marginTop: 24 }}>
        <button
          type="button"
          disabled={!vertical}
          onClick={() => router.push(`/create/${vertical}`)}
          style={{ ...navButtonStyle, ...primaryButtonStyle, opacity: vertical ? 1 : 0.4 }}
        >
          다음
        </button>
      </div>
    </main>
  );
}
