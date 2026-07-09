"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 이미지가 없거나(null) 로드에 실패하면(잘못된 URL 등) true.
 * onError만으로는 하이드레이션 전에 이미 실패한 이미지를 놓칠 수 있어
 * (네이티브 로드가 리액트 이벤트 바인딩보다 먼저 끝나는 레이스),
 * 마운트 시 img.complete/naturalWidth로 한 번 더 확인한다.
 */
export function useImageFallback(src: string | null) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) {
      setFailed(true);
    }
  }, []);

  return {
    ref,
    showImage: Boolean(src) && !failed,
    onError: () => setFailed(true),
  };
}
