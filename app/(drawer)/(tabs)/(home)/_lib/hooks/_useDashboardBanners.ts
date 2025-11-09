// app/(drawer)/(tabs)/(home)/hooks/useDashboardBanners.ts
// Hook para manejar banners del dashboard

import { useEffect, useCallback } from "react";
import type { BannerItem } from "@/store/dashboard.types";

/**
 * Hook que maneja la lógica de banners del dashboard
 */
export function useDashboardBanners(
  readyI18n: boolean,
  tt: (key: string, defaultValue?: string) => string,
  setBanners: (banners: BannerItem[]) => void
) {
  useEffect(() => {
    if (!readyI18n) return;

    setBanners([
      {
        id: "invite-60",
        title: tt("banners.invite.title", "Invite friends, earn €60"),
        body: tt("banners.invite.body", "Earn €60 for each friend you invite by 9 September."),
        until: tt("banners.invite.legal", "T&Cs apply"),
        tint: "#7CC2D1",
      },
      {
        id: "keys-safety",
        title: tt("banners.keys.title", "Take care of your private keys"),
        body: tt("banners.keys.body", "Never share them. We will never ask for them."),
        tint: "#FFB703",
      },
      {
        id: "always-private",
        title: tt("banners.notYourKeys.title", "Remember: not your keys, not your money"),
        body: tt("banners.notYourKeys.body", "Stay safe with HIHODL."),
        tint: "#A68CFF",
      },
    ]);
  }, [readyI18n, tt, setBanners]);

  const dismissBanner = useCallback(() => setBanners([]), [setBanners]);

  return { dismissBanner };
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

