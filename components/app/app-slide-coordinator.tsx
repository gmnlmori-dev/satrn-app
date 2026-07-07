"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type CloseFn = () => void;

type AppSlideCoordinatorValue = {
  register: (id: string, close: CloseFn) => () => void;
  openExclusive: (id: string, open: () => void) => void;
};

const AppSlideCoordinatorContext =
  createContext<AppSlideCoordinatorValue | null>(null);

export function AppSlideCoordinatorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const closersRef = useRef<Map<string, CloseFn>>(new Map());

  const register = useCallback((id: string, close: CloseFn) => {
    closersRef.current.set(id, close);
    return () => {
      closersRef.current.delete(id);
    };
  }, []);

  const openExclusive = useCallback((id: string, open: () => void) => {
    closersRef.current.forEach((close, registeredId) => {
      if (registeredId !== id) close();
    });
    open();
  }, []);

  const value = useMemo(
    () => ({ register, openExclusive }),
    [register, openExclusive],
  );

  return (
    <AppSlideCoordinatorContext.Provider value={value}>
      {children}
    </AppSlideCoordinatorContext.Provider>
  );
}

export function useAppSlideCoordinator(): AppSlideCoordinatorValue {
  const ctx = useContext(AppSlideCoordinatorContext);
  if (!ctx) {
    throw new Error(
      "useAppSlideCoordinator must be used within AppSlideCoordinatorProvider",
    );
  }
  return ctx;
}

/** Slide booleana registrata nel coordinatore (es. nuovo progetto / nuovo inbox). */
export function useExclusiveAppSlide(id: string) {
  const { register, openExclusive } = useAppSlideCoordinator();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    return register(id, () => setOpen(false));
  }, [register, id]);

  const openSlide = useCallback(() => {
    openExclusive(id, () => setOpen(true));
  }, [openExclusive, id]);

  const closeSlide = useCallback(() => {
    setOpen(false);
  }, []);

  return { open, openSlide, closeSlide };
}

/** Registra chiusura custom (es. edit utente con stato nullable). */
export function useRegisterAppSlideClose(id: string, close: CloseFn) {
  const { register } = useAppSlideCoordinator();

  useEffect(() => {
    return register(id, close);
  }, [register, id, close]);
}
