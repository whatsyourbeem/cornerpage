"use client";

import { useEffect, useState } from "react";
import { BoutiqueFitnessSite } from "@/components/site-boutique-fitness/BoutiqueFitnessSite";
import type { MiniHomepageContent } from "@/lib/content-types-boutique-fitness";

export const PREVIEW_MESSAGE = "cornerpage:preview";
export const PREVIEW_READY_MESSAGE = "cornerpage:preview-ready";

/**
 * 편집기 iframe 안에서 도는 미리보기. 저장된 content로 먼저 그리고, 부모(SiteEditor)가
 * postMessage로 보내주는 편집 중 content로 계속 갈아끼운다 — 저장하기 전에도 결과를 볼 수 있다.
 *
 * 같은 페이지에 직접 렌더하지 않고 iframe을 쓰는 이유:
 * 1. Topbar가 window.scrollY를 듣는다 — div 안에 넣으면 페이지 스크롤에 반응해버려서
 *    실제 사이트와 다르게 동작한다(iframe은 자기 window를 갖는다).
 * 2. Hero·Philosophy·TrustStrip의 font-size가 clamp(..., 6.5vw, ...)다 — vw는 컨테이너가
 *    아니라 뷰포트 기준이라, 좁은 칸에 넣어도 글자만 데스크톱 크기로 남는다.
 * 3. Topbar·StickyCta·InquiryDialog가 position: fixed다 — 컨테이닝 블록을 억지로
 *    만들어주지 않으면 편집 화면 전체를 덮는다.
 * iframe은 진짜 뷰포트를 하나 더 주기 때문에 이 셋이 한꺼번에 해결된다.
 */
export function DraftPreview({ initialContent }: { initialContent: MiniHomepageContent }) {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      // 부모 창만 신뢰한다 — 다른 오리진이 iframe에 내용을 주입하지 못하게 막는다.
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; content?: MiniHomepageContent };
      if (data?.type !== PREVIEW_MESSAGE || !data.content) return;
      setContent(data.content);
    }

    window.addEventListener("message", onMessage);
    // 부모가 이 리스너보다 먼저 postMessage하면 첫 편집분을 놓친다 — 준비됐다고
    // 알려서 부모가 그때부터 보내게 한다.
    window.parent?.postMessage({ type: PREVIEW_READY_MESSAGE }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <BoutiqueFitnessSite content={content} />;
}
