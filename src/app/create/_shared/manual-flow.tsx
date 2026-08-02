"use client";

import { useEffect, useState } from "react";
import type { Vertical } from "@/lib/verticals";
import { compressImage } from "@/lib/compress-image";
import { Button } from "@/components/ui";

/** 업로드할 이미지 하나. slot은 /api/upload 저장 경로(site-images/{id}/{slot}.ext)의 이름이 된다. */
export interface PendingUpload {
  slot: string;
  file: File;
}

const UPLOAD_RETRIES = 2;

async function uploadImageOnce(siteId: string, slot: string, file: File): Promise<string> {
  const form = new FormData();
  form.set("site_id", siteId);
  form.set("slot", slot);
  form.set("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(`이미지 업로드 실패(${slot}): ${detail?.error ?? res.status}`);
  }
  const data = await res.json();
  return data.url as string;
}

/**
 * 배포 환경(리전 간 지연·서버리스 콜드스타트)에서 여러 파일을 한꺼번에 올리면
 * 매번 다른 파일이 랜덤하게 실패하는 경합이 관찰됐다 — 로컬에서는 안 드러나던
 * 문제. 재시도 몇 번으로 일시적 실패를 흡수한다.
 */
async function uploadImage(siteId: string, slot: string, file: File): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= UPLOAD_RETRIES; attempt++) {
    try {
      return await uploadImageOnce(siteId, slot, file);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

type Phase = "preparing" | "ready" | "submitting" | "error" | "done";

/**
 * 3단계(Claude API 호출)만 빼고 나머지(draft 발급·이미지 업로드·요청 본문 생성·
 * 보정·검증·저장)를 실제로 수행하는 공용 흐름. general·boutique-fitness 위저드가
 * 이 컴포넌트 하나를 공유한다 — 이미지 목록과 최종 answers 조립 방식만 페이지별로
 * 다르고(props로 주입), 나머지 상태 기계·API 호출·화면은 동일하기 때문이다.
 *
 * 클로드 API를 직접 호출하는 대신, 실제로 보낼 요청 본문을 화면에 보여주고
 * 사람이 그걸 복사해 claude.ai 등에 직접 붙여넣어 받은 응답을 다시 이 화면에
 * 붙여넣게 한다. RENDERER_READY_VERTICALS 게이트는 여기서 적용하지 않는다 —
 * 렌더러가 준비되기 전에도 DB 저장까지 포함한 전체 루프를 테스트할 수 있어야
 * 한다는 판단 때문(boutique-fitness로 만든 사이트는 지금 방문하면 깨진다).
 */
export function ManualGenerationFlow({
  vertical,
  pendingUploads,
  buildAnswers,
  onBack,
}: {
  vertical: Vertical;
  pendingUploads: PendingUpload[];
  buildAnswers: (urls: Record<string, string>) => unknown;
  onBack: () => void;
}) {
  // 마운트 직후 곧바로 handlePrepare가 시작되므로, 초기값을 이미 그 상태로
  // 잡아둔다 — effect 안에서 동기적으로 setState하면 react-hooks/set-state-in-effect
  // 규칙에 걸린다(TrustStrip.tsx의 기존 위반과 같은 종류, 새로 반복하지 않는다).
  const [phase, setPhase] = useState<Phase>("preparing");
  const [siteId, setSiteId] = useState<string | null>(null);
  const [answersForSubmit, setAnswersForSubmit] = useState<unknown>(null);
  const [requestBodyJson, setRequestBodyJson] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [resultSlug, setResultSlug] = useState<string | null>(null);

  async function handlePrepare() {
    try {
      const draftRes = await fetch("/api/sites/draft", { method: "POST" });
      if (!draftRes.ok) throw new Error((await draftRes.json()).error ?? "draft 발급에 실패했어요.");
      const { id } = (await draftRes.json()) as { id: string };
      setSiteId(id);

      // 한꺼번에 병렬로 쏘면 배포 환경(리전 간 지연·서버리스 콜드스타트)에서
      // 매번 다른 파일이 랜덤하게 실패하는 경합이 관찰됐다 — 순차 업로드로 바꿔서
      // 동시 요청 수 자체를 없앤다(느리지만 이 단계는 사이트 생성 시 한 번뿐이라
      // 안정성이 속도보다 중요하다).
      const urlEntries: [string, string][] = [];
      for (const { slot, file } of pendingUploads) {
        const compressed = await compressImage(file);
        urlEntries.push([slot, await uploadImage(id, slot, compressed)]);
      }
      const urls = Object.fromEntries(urlEntries);

      const answers = buildAnswers(urls);
      setAnswersForSubmit(answers);

      const reqRes = await fetch("/api/sites/request-body", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vertical, answers }),
      });
      if (!reqRes.ok) throw new Error((await reqRes.json()).error ?? "요청 본문 생성에 실패했어요.");
      const { requestBody } = (await reqRes.json()) as { requestBody: unknown };
      setRequestBodyJson(JSON.stringify(requestBody, null, 2));
      setPhase("ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류");
      setPhase("error");
    }
  }

  async function handleSubmitResponse() {
    if (!siteId) return;
    setPhase("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/sites/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: siteId,
          vertical,
          answers: answersForSubmit,
          claude_response_text: responseText,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "저장에 실패했어요.");
      }
      const data = (await res.json()) as { slug: string };
      setResultSlug(data.slug);
      setPhase("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "알 수 없는 오류");
      setPhase("ready"); // 붙여넣은 응답을 고쳐서 다시 시도할 수 있게 ready로 되돌린다
    }
  }

  async function handleCopy() {
    if (requestBodyJson) await navigator.clipboard.writeText(requestBodyJson);
  }

  useEffect(() => {
    // handlePrepare의 setState 호출은 전부 await 뒤(마이크로태스크)에서 일어나는데,
    // 이 린트 규칙은 그 구분 없이 "effect가 부르는 함수가 언젠가 setState를
    // 부르면" 전부 잡아낸다(같은 종류의 오탐이 이 저장소의 TrustStrip.tsx에도
    // 이미 있음 — react-hooks/set-state-in-effect). 표준적인 "마운트 시 fetch"
    // 패턴이라 억지로 구조를 바꾸는 대신 여기서만 끈다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handlePrepare();
    // 마운트 시 한 번만 실행 — pendingUploads/buildAnswers는 부모가 매 렌더마다
    // 새로 만드는 값이라 deps에 넣으면 무한 재실행된다. 이 컴포넌트는 한 번의
    // "제출 시도"마다 새로 마운트되는 용도로 쓴다(부모의 onBack이 언마운트시킴).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "done" && resultSlug) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-16 text-center text-cp-fg">
        <h1 className="text-cp-h4 font-bold">홈페이지가 만들어졌어요</h1>
        <p className="my-2 text-[13px] text-cp-body">서브도메인 배포 전에도 아래 경로로 바로 확인할 수 있어요.</p>
        <a href={`/site/${resultSlug}`} className="text-[16px] font-bold text-cp-primary">
          /site/{resultSlug} 열기 →
        </a>
        <p className="mt-5 text-[12px] text-cp-muted">
          실서비스 URL: {resultSlug}.cornerpage.co (로컬 확인: {resultSlug}.localhost:3000)
        </p>
      </main>
    );
  }

  if (phase === "preparing") {
    return (
      <main className="mx-auto w-full max-w-2xl px-5 py-10 pb-20 text-cp-fg">
        <h1 className="text-cp-h4 font-bold">요청 준비 중</h1>
        <p className="mt-1 text-[13px] text-cp-body">이미지를 업로드하고 클로드에 보낼 요청 본문을 만들고 있어요...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-10 pb-20 text-cp-fg">
      <h1 className="text-cp-h4 font-bold">클로드 API로 보낼 요청 본문</h1>
      <p className="mt-1 mb-3 text-[13px] text-cp-body">
        아래 내용을 복사해서 claude.ai 등에 직접 붙여넣어 응답을 받아온 뒤, 그 응답을 아래 칸에 붙여넣고 제출해주세요.
      </p>
      <Button variant="outline" size="md" onClick={handleCopy} className="mb-3">
        복사하기
      </Button>
      <pre className="max-h-[400px] overflow-x-auto whitespace-pre rounded-cp-md border border-cp-border bg-cp-surface p-4 text-[12px] leading-relaxed text-cp-fg">
        {requestBodyJson}
      </pre>

      <h2 className="mt-6 mb-2 text-[15px] font-bold text-cp-fg">클로드 응답 붙여넣기</h2>
      <textarea
        value={responseText}
        onChange={(e) => setResponseText(e.target.value)}
        rows={12}
        placeholder="claude.ai에서 받은 콘텐츠 JSON을 여기에 붙여넣어주세요."
        className="w-full rounded-cp-md border border-cp-border bg-cp-canvas p-3 font-mono text-[12px] text-cp-fg outline-none focus:border-cp-primary"
      />

      {errorMsg && <p className="mt-3 text-[13px] text-cp-danger">{errorMsg}</p>}

      <div className="mt-4 flex gap-2">
        <Button variant="outline" size="lg" onClick={onBack}>
          답변 수정하러 가기
        </Button>
        <Button
          size="lg"
          disabled={!responseText.trim() || phase === "submitting"}
          loading={phase === "submitting"}
          onClick={handleSubmitResponse}
        >
          응답 제출하고 저장하기
        </Button>
      </div>
    </main>
  );
}
