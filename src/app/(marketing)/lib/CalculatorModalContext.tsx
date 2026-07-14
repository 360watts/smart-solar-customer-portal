"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type CalculatorModalContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CalculatorModalContext = createContext<CalculatorModalContextValue | null>(null);

/** Lives at the marketing layout level so the nav's "Calculate Savings"
 *  button can open the calculator from any marketing page, not just the homepage. */
export function CalculatorModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <CalculatorModalContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </CalculatorModalContext.Provider>
  );
}

export function useCalculatorModal() {
  const ctx = useContext(CalculatorModalContext);
  if (!ctx) throw new Error("useCalculatorModal must be used within CalculatorModalProvider");
  return ctx;
}
