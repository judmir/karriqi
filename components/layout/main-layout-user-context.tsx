"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type MainLayoutUserState = {
  userId: string | null;
  userEmail: string;
  userDisplayName: string | null;
  userAvatarPreset: string | null;
  includeDevNav: boolean;
};

const defaultState: MainLayoutUserState = {
  userId: null,
  userEmail: "Signed in",
  userDisplayName: null,
  userAvatarPreset: null,
  includeDevNav: false,
};

type MainLayoutUserContextValue = MainLayoutUserState & {
  setUser: (next: MainLayoutUserState) => void;
};

const MainLayoutUserContext = createContext<MainLayoutUserContextValue | null>(
  null,
);

export function MainLayoutUserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<MainLayoutUserState>(defaultState);
  const setUser = useCallback((next: MainLayoutUserState) => {
    setUserState(next);
  }, []);

  const value = useMemo(
    () => ({ ...user, setUser }),
    [user, setUser],
  );

  return (
    <MainLayoutUserContext.Provider value={value}>
      {children}
    </MainLayoutUserContext.Provider>
  );
}

export function useMainLayoutUser(): MainLayoutUserContextValue {
  const ctx = useContext(MainLayoutUserContext);
  if (!ctx) {
    throw new Error("useMainLayoutUser must be used within MainLayoutUserProvider");
  }
  return ctx;
}
