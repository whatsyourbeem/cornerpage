"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

/**
 * 확장(extension) — DESIGN.md 미검증. 사진 업로드 전용 필드. sr-only 네이티브
 * input을 라벨로 감싸서 클릭 영역을 만든다 — Tailwind preflight가
 * <input type=file>의 appearance를 지워버리는 문제(예전 form-ui.tsx의
 * fileInputStyle 해킹) 자체가 없어진다. 선택한 파일마다 썸네일 미리보기 +
 * 개별 삭제 버튼을 보여준다.
 */

export function FileField({
  label,
  help,
  multiple = false,
  maxFiles,
  value,
  onChange,
  accept = "image/*",
}: {
  label: string;
  help?: string;
  multiple?: boolean;
  maxFiles?: number;
  value: File[];
  onChange: (files: File[]) => void;
  accept?: string;
}) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [urls, setUrls] = useState<string[]>([]);

  // File 객체는 렌더 중에 URL을 만들 수 없다(정리 시점이 없어 누수) — 이펙트에서
  // 만들고 언마운트·값 변경 시 반드시 revoke한다. react-hooks/set-state-in-effect가
  // 걸리지만, manual-flow.tsx·TrustStrip.tsx와 같은 표준적인 파생 상태 패턴이다.
  useEffect(() => {
    const next = value.map((file) => URL.createObjectURL(file));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrls(next);
    return () => {
      next.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [value]);

  function handlePick(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const picked = Array.from(fileList);
    if (multiple) {
      const merged = [...value, ...picked];
      onChange(maxFiles ? merged.slice(0, maxFiles) : merged);
    } else {
      onChange([picked[0]]);
    }
    // 같은 파일을 다시 골라도 onChange가 또 트리거되도록 초기화.
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-semibold text-cp-fg">
        {label}
      </label>

      {urls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, i) => (
            <div key={url} className="group relative h-20 w-20 flex-none overflow-hidden rounded-cp-md border border-cp-border bg-cp-surface">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: object URL, next/image가 다루지 않는 로컬 미리보기 */}
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label="사진 삭제"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-cp-fg/70 text-white transition-opacity hover:bg-cp-fg"
              >
                <X className="h-3 w-3" strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      {(multiple || value.length === 0) && (!maxFiles || value.length < maxFiles) && (
        <label
          htmlFor={fieldId}
          className="flex h-20 w-20 flex-none cursor-pointer flex-col items-center justify-center gap-1 rounded-cp-md border border-dashed border-cp-border bg-cp-canvas text-cp-muted transition-colors hover:bg-cp-surface"
        >
          <ImagePlus className="h-5 w-5" aria-hidden />
          <span className="text-[11px] font-semibold">사진 추가</span>
        </label>
      )}

      <input
        ref={inputRef}
        id={fieldId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => handlePick(e.target.files)}
      />

      {help && <p className="text-[13px] text-cp-muted">{help}</p>}
    </div>
  );
}
