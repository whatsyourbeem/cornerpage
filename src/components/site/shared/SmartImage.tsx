"use client";

import { useImageFallback } from "@/lib/useImageFallback";

/**
 * 이미지 로드 실패(잘못된 URL, 404 등) 시에도 깨진 이미지 아이콘이 아니라
 * 톤 텍스처 플레이스홀더를 보여준다. null 폴백과 별개로, 유효하지 않은
 * URL이 들어왔을 때의 방어 처리.
 */
export function SmartImage({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const { ref, showImage, onError } = useImageFallback(src);

  if (!showImage) {
    return (
      <div
        className={`${className ?? ""} mhp-dot-texture`}
        style={{ background: "var(--brand)" }}
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={onError}
    />
  );
}
