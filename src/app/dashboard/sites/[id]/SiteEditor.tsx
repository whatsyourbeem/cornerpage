"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Pencil } from "lucide-react";
import { Button, cx } from "@/components/ui";
import type { Blocks, MiniHomepageContent } from "@/lib/content-types-boutique-fitness";
import { BlockEditors } from "./_editor/BlockEditors";
import { PREVIEW_MESSAGE, PREVIEW_READY_MESSAGE } from "./preview/DraftPreview";

interface SaveErrorDetail {
  path: string;
  label: string;
  message: string;
}

/**
 * boutique-fitness 사이트의 블록 편집기.
 *
 * 편집 대상은 content_json 그 자체다 — sites에는 입력 원본(answers)이 남지 않아
 * Claude 재생성 경로가 애초에 없고, 렌더러가 content_json의 순수 함수라 여기서
 * 고친 값이 곧 사이트다.
 *
 * 저장 전까지는 전부 이 컴포넌트의 로컬 상태다. 미리보기 iframe에는 편집 중인
 * content를 postMessage로 계속 흘려보내서, 저장하지 않고도 결과를 볼 수 있다.
 */
export function SiteEditor({
  siteId,
  initialContent,
  initialUpdatedAt,
}: {
  siteId: string;
  initialContent: MiniHomepageContent;
  initialUpdatedAt: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialContent));
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<SaveErrorDetail[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");

  const dirty = JSON.stringify(content) !== savedJson;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewReady, setPreviewReady] = useState(false);

  // iframe이 리스너를 붙이기 전에 postMessage하면 첫 편집분을 놓친다 — 준비됐다는
  // 신호를 받은 다음부터 보낸다.
  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if ((event.data as { type?: string })?.type === PREVIEW_READY_MESSAGE) setPreviewReady(true);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // 타이핑 한 글자마다 사이트 전체를 다시 그리면 입력이 끊긴다 — 살짝 미뤄서 보낸다.
  useEffect(() => {
    if (!previewReady) return;
    const timer = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: PREVIEW_MESSAGE, content },
        window.location.origin
      );
    }, 150);
    return () => clearTimeout(timer);
  }, [content, previewReady]);

  // 저장하지 않은 편집분을 들고 화면을 벗어나려 하면 브라우저 기본 경고를 띄운다.
  useEffect(() => {
    if (!dirty) return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  function updateBlocks(updater: (prev: Blocks) => Blocks) {
    setContent((prev) => ({ ...prev, blocks: updater(prev.blocks) }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setErrorDetails([]);
    setJustSaved(false);
    try {
      const res = await fetch(`/api/sites/${siteId}/content`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_json: content, base_updated_at: updatedAt }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "저장에 실패했어요.");
        setErrorDetails(data?.details ?? []);
        return;
      }
      // 서버가 주소 변경 시 map_coordinates를 다시 채워 넣으므로, 저장된 결과를
      // 그대로 받아 로컬 상태를 맞춘다 — 안 그러면 저장 직후부터 미세하게 어긋난다.
      const stored = (data as { content_json: MiniHomepageContent; updated_at: string }).content_json;
      setContent(stored);
      setSavedJson(JSON.stringify(stored));
      setUpdatedAt(data.updated_at);
      setJustSaved(true);
    } catch {
      setError("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6">
      {/* 모바일에서는 편집·미리보기를 한 화면에 같이 둘 폭이 없어 탭으로 가른다. */}
      <div className="mb-4 flex gap-1 rounded-cp-btn-lg bg-cp-surface p-1 lg:hidden">
        {(
          [
            { key: "edit", label: "편집", icon: Pencil },
            { key: "preview", label: "미리보기", icon: Monitor },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMobileTab(key)}
            className={cx(
              "flex h-9 flex-1 items-center justify-center gap-1.5 rounded-cp-sm text-[13px] font-bold transition-colors",
              mobileTab === key ? "bg-cp-canvas text-cp-fg" : "text-cp-muted"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        <div className={cx("min-w-0 flex-1", mobileTab === "preview" && "hidden lg:block")}>
          <BlockEditors
            siteId={siteId}
            content={content}
            onMetaChange={(meta) => setContent((prev) => ({ ...prev, meta }))}
            onBlocksChange={updateBlocks}
          />
        </div>

        <div className={cx("flex-none lg:block", mobileTab === "edit" && "hidden")}>
          <div className="lg:sticky lg:top-6">
            <iframe
              ref={iframeRef}
              src={`/dashboard/sites/${siteId}/preview`}
              title="홈페이지 미리보기"
              className="h-[720px] w-full rounded-cp-btn-lg border border-cp-border bg-cp-canvas lg:w-[390px]"
            />
            <p className="mt-2 text-center text-[12px] text-cp-muted">
              편집 중인 내용이 바로 반영돼요. 저장해야 실제 홈페이지에 적용됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 저장 바는 항상 화면 아래 붙어 있어야 한다 — 블록이 많아 스크롤이 길다. */}
      <div className="sticky bottom-0 z-10 -mx-5 mt-6 border-t border-cp-border bg-cp-canvas px-5 py-3">
        {error && (
          <div className="mb-2.5 rounded-cp-md border border-cp-danger/30 bg-cp-danger/5 px-3 py-2.5">
            <p className="text-[13px] font-semibold text-cp-danger">{error}</p>
            {errorDetails.length > 0 && (
              <ul className="mt-1.5 flex flex-col gap-1">
                {errorDetails.map((detail) => (
                  <li key={detail.path} className="text-[12px] text-cp-body">
                    <span className="font-semibold">{detail.label}</span> — {detail.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button size="xl" className="flex-1" onClick={handleSave} loading={saving} disabled={!dirty}>
            {dirty ? "저장하기" : "저장됨"}
          </Button>
          {justSaved && !dirty && (
            <span className="text-[13px] font-semibold text-cp-body">저장했어요</span>
          )}
        </div>
      </div>
    </div>
  );
}
