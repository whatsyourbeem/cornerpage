"use client";

import { useEffect, useRef } from "react";

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

/**
 * 스텝을 넘길 때만 저장하던 이전 방식은, 한 스텝 안에서 오래 입력하다 탭을
 * 닫으면 그 스텝 전체가 날아가는 문제가 있었다. 값이 바뀔 때마다(디바운스)
 * 저장하도록 바꾼다 — 매 타이핑마다 localStorage에 쓰지 않도록 delayMs만큼
 * 묶어서 쓴다. 마운트 시(첫 렌더)의 저장은 건너뛴다 — 안 그러면 페이지를 막
 * 열었을 때의 빈 초기 상태가 곧바로 저장되어, 기존에 남아있던 draft를
 * 사용자가 "이어서 작성"을 누르기도 전에 지워버린다.
 */
export function useDebouncedDraftSave<T>(key: string, snapshot: T, delayMs = 800): void {
  const isFirstRender = useRef(true);
  const serialized = JSON.stringify(snapshot);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveDraft(key, snapshot);
    }, delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- serialized 문자열만으로 변경 여부를 판단한다
  }, [key, serialized, delayMs]);
}
