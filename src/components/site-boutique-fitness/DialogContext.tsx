"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface DialogContextValue {
  isOpen: boolean;
  openDialog: () => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

/**
 * topbar·hero·sticky_cta의 cta_label 버튼이 전부 같은 다이얼로그를 연다(design-guide.md
 * 4-1장) — prop drilling 대신 컨텍스트로 openDialog 하나만 내려준다.
 */
export function InquiryDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <DialogContext.Provider
      value={{
        isOpen,
        openDialog: () => setIsOpen(true),
        closeDialog: () => setIsOpen(false),
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export function useInquiryDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error("useInquiryDialog must be used within InquiryDialogProvider");
  return ctx;
}
