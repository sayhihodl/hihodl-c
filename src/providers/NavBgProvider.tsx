import React, { createContext, useContext, useState, useMemo } from "react";

type Ctx = { color: string; setColor: (c: string) => void };
const NavBgCtx = createContext<Ctx | undefined>(undefined);

export function NavBgProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = useState<string>("#0F0F1A"); // valor por defecto
  const value = useMemo(() => ({ color, setColor }), [color]);
  return <NavBgCtx.Provider value={value}>{children}</NavBgCtx.Provider>;
}

export function useNavBg() {
  const ctx = useContext(NavBgCtx);
  if (!ctx) throw new Error("useNavBg must be used inside <NavBgProvider>");
  return ctx;
}