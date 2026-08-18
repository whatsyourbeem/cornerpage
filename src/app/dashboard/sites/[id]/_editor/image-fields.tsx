"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import { cx } from "@/components/ui";

/**
 * 편집 화면의 사진 필드. /create 위저드의 FileField와 달리 File을 들고 있다가
 * 제출 때 한꺼번에 올리는 게 아니라, 고르는 즉시 업로드하고 content_json에는 URL만
 * 남긴다 — 편집기의 상태는 언제나 "저장 가능한 content_json 그 자체"여야 하기 때문.
 */

const UPLOAD_RETRIES = 2;

async function uploadOnce(siteId: string, slot: string, file: File): Promise<string> {
  const form = new FormData();
  form.set("site_id", siteId);
  form.set("slot", slot);
  form.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? "사진 업로드에 실패했어요.");
  }
  return ((await res.json()) as { url: string }).url;
}

/** manual-flow.tsx와 같은 이유의 재시도 — 배포 환경에서 일시적 업로드 실패가 관찰됐다. */
async function uploadImage(siteId: string, slot: string, file: File): Promise<string> {
  const compressed = await compressImage(file);
  let lastError: unknown;
  for (let attempt = 0; attempt <= UPLOAD_RETRIES; attempt++) {
    try {
      return await uploadOnce(siteId, slot, compressed);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

function Thumbnail({ url, onRemove }: { url: string; onRemove?: () => void }) {
  return (
    <div className="group relative h-20 w-20 flex-none overflow-hidden rounded-cp-md border border-cp-border bg-cp-surface">
      {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage 공개 URL, next/image 최적화 대상 아님 */}
      <img src={url} alt="" className="h-full w-full object-cover" />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="사진 삭제"
          className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cp-fg/70 text-white transition-opacity hover:bg-cp-fg"
        >
          <X className="h-3 w-3" strokeWidth={3} aria-hidden />
        </button>
      )}
    </div>
  );
}

function PickButton({
  id,
  busy,
  multiple,
  onPick,
}: {
  id: string;
  busy: boolean;
  multiple: boolean;
  onPick: (files: FileList | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <label
        htmlFor={id}
        className={cx(
          "flex h-20 w-20 flex-none cursor-pointer flex-col items-center justify-center gap-1 rounded-cp-md border border-dashed border-cp-border bg-cp-canvas text-cp-muted transition-colors hover:bg-cp-surface",
          busy && "pointer-events-none opacity-60"
        )}
      >
        <ImagePlus className="h-5 w-5" aria-hidden />
        <span className="text-[11px] font-semibold">{busy ? "올리는 중" : "사진 추가"}</span>
      </label>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          onPick(e.target.files);
          // 같은 파일을 다시 골라도 onChange가 또 트리거되도록 초기화.
          if (inputRef.current) inputRef.current.value = "";
        }}
      />
    </>
  );
}

/** 사진 한 장(없으면 null). slot은 저장 경로의 이름표 — 서버가 뒤에 난수를 붙인다. */
export function ImageField({
  siteId,
  slot,
  value,
  onChange,
}: {
  siteId: string;
  slot: string;
  value: string | null;
  onChange: (next: string | null) => void;
}) {
  const fieldId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await uploadImage(siteId, slot, file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 업로드에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        {value && <Thumbnail url={value} onRemove={() => onChange(null)} />}
        {!value && <PickButton id={fieldId} busy={busy} multiple={false} onPick={handlePick} />}
      </div>
      {error && <p className="text-[12px] text-cp-danger">{error}</p>}
    </div>
  );
}

/** 사진 여러 장. required면 빈 배열 대신 null로 내려보내지 않고 최소 1장을 요구한다. */
export function ImageListField({
  siteId,
  slot,
  value,
  onChange,
  max,
}: {
  siteId: string;
  slot: string;
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}) {
  const fieldId = useId();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canAdd = max === undefined || value.length < max;

  async function handlePick(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = max === undefined ? files.length : max - value.length;
    const picked = Array.from(files).slice(0, room);
    setBusy(true);
    setError(null);
    try {
      // 순차 업로드 — manual-flow.tsx와 같은 이유(동시 요청 시 경합으로 일부가 실패).
      const uploaded: string[] = [];
      for (const [index, file] of picked.entries()) {
        uploaded.push(await uploadImage(siteId, `${slot}-${value.length + index}`, file));
      }
      onChange([...value, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진 업로드에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        {value.map((url, index) => (
          <Thumbnail
            key={`${url}-${index}`}
            url={url}
            onRemove={() => onChange(value.filter((_, i) => i !== index))}
          />
        ))}
        {canAdd && <PickButton id={fieldId} busy={busy} multiple onPick={handlePick} />}
      </div>
      {error && <p className="text-[12px] text-cp-danger">{error}</p>}
      {!canAdd && max !== undefined && (
        <p className="text-[12px] text-cp-muted">사진은 최대 {max}장까지 넣을 수 있어요.</p>
      )}
    </div>
  );
}
