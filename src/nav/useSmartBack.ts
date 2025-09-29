import React from "react";
import { BackHandler } from "react-native";
import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { usePathname, useRouter, type Href } from "expo-router";

type Options = {
  mainCycle: string[];   // orden de tabs raíz
  fallback: Href;        // por si todo falla
  maxHistory?: number;
  drawerId?: string;     // id del Drawer
};

export function useSmartBack({
  mainCycle,
  fallback,
  maxHistory = 30,
  drawerId = "app-drawer",
}: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const histRef = React.useRef<string[]>([]);
  const lastBackAt = React.useRef(0);

  const norm = (p?: string | null) => (p || "").replace(/[?#].*$/, "");

  useFocusEffect(
    React.useCallback(() => {
      const p = norm(pathname);
      const h = histRef.current;
      if (h[h.length - 1] !== p) {
        h.push(p);
        if (h.length > maxHistory) h.shift();
      }
      return () => {};
    }, [pathname, maxHistory])
  );

  const collapseTail = React.useCallback(() => {
    const h = histRef.current;
    while (h.length >= 2 && h[h.length - 1] === h[h.length - 2]) h.pop();
  }, []);

  const goBackSmart = React.useCallback(() => {
    const now = Date.now();
    if (now - lastBackAt.current < 200) return;
    lastBackAt.current = now;

    collapseTail();
    const h = histRef.current;

    if (h.length > 1) {
      const current = h.pop()!;
      collapseTail();
      const target = h[h.length - 1];
      if (target && target !== current) {
        router.replace(target as any);
        return;
      }
    }
    const cur = norm(pathname);
    const idx = mainCycle.indexOf(cur);
    const next = idx >= 0 ? mainCycle[(idx - 1 + mainCycle.length) % mainCycle.length] : mainCycle[0];
    router.replace(next as any);
  }, [pathname, mainCycle, router, collapseTail]);

  const attachToNavigation = React.useCallback(
    (navigation: any) => {
      const parent = navigation.getParent?.(drawerId) ?? navigation.getParent?.();
      parent?.dispatch?.(DrawerActions.closeDrawer());
      parent?.setOptions?.({ swipeEnabled: false, swipeEdgeWidth: 0 });

      const subBefore = navigation.addListener("beforeRemove", (e: any) => {
        if (e?.data?.action?.type === "REPLACE") return;
        e.preventDefault();
        goBackSmart();
      });

      const subHW = BackHandler.addEventListener("hardwareBackPress", () => {
        goBackSmart();
        return true;
      });

      return () => {
        subBefore();
        subHW.remove?.();
        parent?.setOptions?.({ swipeEnabled: true, swipeEdgeWidth: 30 });
      };
    },
    [goBackSmart, drawerId]
  );

  return { goBackSmart, attachToNavigation };
}