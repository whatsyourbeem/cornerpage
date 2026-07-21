"use client";

/**
 * 업로드 전 클라이언트에서 이미지를 리사이즈+재인코딩한다. 스마트폰 원본 사진은
 * 보통 3000~4000px대라 그대로 올리면 Vercel 요청 본문 제한(4.5MB)에 걸리기 쉽고,
 * 업로드 시간이 길어질수록 동시 업로드 시 경합(멀티파트 바디 손상) 위험도 커진다.
 *
 * WebP가 같은 화질 기준 JPEG보다 25~35% 더 작고 알파채널(투명 배경 로고)도
 * 지원해서 우선 시도하되, 구형 Safari 등 인코딩 미지원 브라우저에서는
 * canvas.toBlob이 자동으로 PNG를 돌려주므로(스펙 동작) 그 경우 JPEG로 폴백한다.
 */
const MAX_DIMENSION = 1600;
const QUALITY = 0.8;
const SKIP_THRESHOLD_BYTES = 300 * 1024;

function replaceExtension(filename: string, ext: string): string {
  return filename.replace(/\.[^./]+$/, "") + "." + ext;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File): Promise<File> {
  // GIF는 애니메이션 보존을 위해 재인코딩하지 않는다.
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const longEdge = Math.max(bitmap.width, bitmap.height);

    if (file.size < SKIP_THRESHOLD_BYTES && longEdge <= MAX_DIMENSION) {
      bitmap.close();
      return file;
    }

    const scale = Math.min(1, MAX_DIMENSION / longEdge);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const webpBlob = await canvasToBlob(canvas, "image/webp", QUALITY);
    if (webpBlob && webpBlob.type === "image/webp") {
      return new File([webpBlob], replaceExtension(file.name, "webp"), { type: "image/webp" });
    }

    // webp 인코딩 미지원 브라우저 — JPEG로 폴백(투명 배경은 흰 배경으로 깔린다).
    const jpegBlob = await canvasToBlob(canvas, "image/jpeg", QUALITY);
    if (jpegBlob) {
      return new File([jpegBlob], replaceExtension(file.name, "jpg"), { type: "image/jpeg" });
    }

    return file;
  } catch {
    // 압축 파이프라인이 실패해도 업로드 자체는 막지 않는다 — 원본 그대로 진행.
    return file;
  }
}
