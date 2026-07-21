"use client";

/**
 * 입력 폼(general·boutique-fitness 공용) 임시저장. 문항이 많아서(5개 스텝) 실수로
 * 페이지를 나가거나 로그인 세션이 만료되면 처음부터 다시 써야 하는 부담을 줄이기
 * 위해, 스텝을 넘어갈 때마다 텍스트 답변을 localStorage에 저장해둔다.
 *
 * 사진(File 객체)은 여기 저장하지 않는다 — localStorage는 문자열만 저장 가능하고,
 * File을 base64로 밀어넣으면 용량 한도(보통 5~10MB)를 금방 넘긴다. 복원 시 사진은
 * 다시 첨부해야 하지만, 텍스트 답변만 살아 있어도 부담이 크게 줄어든다는 판단.
 */
export function loadDraft<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveDraft<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // 저장 실패(용량 초과·프라이빗 모드 등)해도 폼 작성 자체는 막지 않는다.
  }
}

export function clearDraft(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // no-op
  }
}
