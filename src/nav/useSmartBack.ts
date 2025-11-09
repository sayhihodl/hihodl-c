import React from "react";
import { BackHandler } from "react-native";
import { DrawerActions, useFocusEffect, usePreventRemove } from "@react-navigation/native";
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
      // Busca el primer ancestro que sea un Drawer
      let parent = navigation?.getParent?.(drawerId) ?? navigation?.getParent?.();
      const isDrawer = (nav: any) => nav?.getState?.()?.type === "drawer";
      while (parent && !isDrawer(parent)) {
        parent = parent.getParent?.();
      }
      // Solo cierra si realmente estamos dentro de un Drawer
      if (parent && isDrawer(parent)) {
        parent.dispatch?.(DrawerActions.closeDrawer());
        parent.setOptions?.({ swipeEnabled: false, swipeEdgeWidth: 0 });
      }

      // Usar beforeRemove listener SOLO para navegación programática
      // CRÍTICO: NO prevenir gestos nativos para evitar desincronización entre estado nativo y JS
      // Los gestos nativos (swipe back) deben funcionar normalmente sin intervención
      const subBefore = navigation.addListener("beforeRemove", (e: any) => {
        const action = e?.data?.action;
        const actionType = action?.type;
        const actionSource = action?.source;
        
        // Permitir REPLACE siempre sin prevenir
        if (actionType === "REPLACE") {
          return;
        }
        
        // CRÍTICO: NO prevenir ningún POP - esto evita el error de desincronización
        // Los gestos nativos (swipe back) eliminan la pantalla nativamente, y si prevenimos
        // aquí, el estado JS no se actualiza, causando el error.
        // Solo el botón back de hardware se maneja con BackHandler.
        if (actionType === "POP") {
          // NO prevenir ningún POP - dejar que React Navigation maneje la navegación normalmente
          // El goBackSmart solo se usa para hardware back button (manejado por BackHandler)
          return;
        }
        
        // Solo prevenir otros tipos de acciones si es necesario
        // Pero en la práctica, solo POP y REPLACE son comunes
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

/**
 * Hook para usar usePreventRemove en pantallas individuales
 * Úsalo en pantallas que necesiten prevenir la eliminación inteligente
 * 
 * IMPORTANTE: usePreventRemove previene la eliminación automáticamente cuando enabled=true
 * El callback solo se ejecuta cuando se intenta eliminar. Si queremos permitir la eliminación,
 * debemos deshabilitar el hook (enabled=false) o dispatch la acción en el callback.
 */
export function useSmartPreventRemove(enabled: boolean = true, onBack?: () => void) {
  const navigation = React.useRef<any>(null);
  
  // Obtener navigation desde el contexto
  React.useEffect(() => {
    // Intentar obtener navigation del contexto si está disponible
    try {
      const { useNavigation } = require("@react-navigation/native");
      // eslint-disable-next-line react-hooks/rules-of-hooks
      navigation.current = useNavigation();
    } catch {
      // Si no está disponible, no hacer nada
    }
  }, []);

  usePreventRemove(enabled, ({ data }) => {
    // Permitir REPLACE siempre - no prevenir
    if (data?.action?.type === "REPLACE") {
      // Deshabilitar temporalmente y dispatch la acción
      if (navigation.current) {
        navigation.current.dispatch(data.action);
      }
      return;
    }
    // Permitir gestos nativos (swipe back) - dispatch la acción para evitar desincronización
    if (data?.action?.type === "POP" && (data?.action?.source === "gesture" || data?.action?.source === "popStack")) {
      // Permitir el gesto nativo dispatchando la acción
      if (navigation.current) {
        navigation.current.dispatch(data.action);
      }
      return;
    }
    // Para otros casos, ejecutar callback personalizado (el hook ya previno la eliminación)
    if (onBack) {
      onBack();
    }
  });
}