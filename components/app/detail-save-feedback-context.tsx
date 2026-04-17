"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type Ctx = {
  /** Breve impulso visivo nella top bar dopo un salvataggio (dettaglio richiesta). */
  topBarSavePulse: boolean;
  pulseTopBar: () => void;
};

const DetailSaveFeedbackContext = createContext<Ctx | null>(null);

const PULSE_MS = 2800;

export function DetailSaveFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [topBarSavePulse, setTopBarSavePulse] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const pulseTopBar = useCallback(() => {
    setTopBarSavePulse(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => {
      setTopBarSavePulse(false);
      t.current = undefined;
    }, PULSE_MS);
  }, []);

  useEffect(
    () => () => {
      if (t.current) clearTimeout(t.current);
    },
    []
  );

  return (
    <DetailSaveFeedbackContext.Provider
      value={{ topBarSavePulse, pulseTopBar }}
    >
      {children}
    </DetailSaveFeedbackContext.Provider>
  );
}

export function useDetailSaveFeedback(): Ctx {
  const ctx = useContext(DetailSaveFeedbackContext);
  if (!ctx) {
    return { topBarSavePulse: false, pulseTopBar: () => {} };
  }
  return ctx;
}
