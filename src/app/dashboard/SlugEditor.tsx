"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField } from "@/components/ui";
import { SLUG_RE } from "@/lib/sites";

export function SlugEditor({ siteId, currentSlug }: { siteId: string; currentSlug: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentSlug);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setValue(currentSlug);
    setError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!SLUG_RE.test(value)) {
      setError("소문자·숫자·하이픈만 사용할 수 있어요 (하이픈으로 시작·끝 불가).");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/sites/${siteId}/slug`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: value }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error ?? "변경에 실패했어요.");
      return;
    }
    setEditing(false);
    router.refresh();
  };

  if (!editing) {
    return (
      <div className="mt-1 flex items-center gap-2">
        <p className="text-[12px] text-cp-muted">주소: {currentSlug}</p>
        <button
          type="button"
          onClick={startEditing}
          className="text-[12px] font-semibold text-cp-primary hover:underline"
        >
          변경
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <TextField
        label="새 주소"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        error={error ?? undefined}
        containerClassName="gap-1"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave} loading={saving}>
          저장
        </Button>
        <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
          취소
        </Button>
      </div>
    </div>
  );
}
