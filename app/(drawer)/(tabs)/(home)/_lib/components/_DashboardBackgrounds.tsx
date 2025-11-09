// app/(drawer)/(tabs)/(home)/components/DashboardBackgrounds.tsx
// Componentes de fondo y overlays del dashboard

import React, { useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import type { Account } from "@/hooks/useAccount";
import { ACCOUNT_GRADS } from "../utils/_dashboardConstants";
import { DASHBOARD_LAYOUT } from "@/constants/dashboard";

interface DashboardBackgroundsProps {
  account: Account;
  insetsTop: number;
}

/**
 * Overlay superior para cubrir notch
 */
export function TopCapOverlay({ account, insetsTop }: DashboardBackgroundsProps) {
  const TOP_CAP = DASHBOARD_LAYOUT.TOP_CAP;
  
  return useMemo(() => (
    <LinearGradient
      key={`cap-${account}`}
      colors={ACCOUNT_GRADS[account]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: insetsTop + TOP_CAP,
        zIndex: 999,
      }}
      pointerEvents="none"
    />
  ), [account, insetsTop]);
}

/**
 * Backdrop del hero section
 */
export function HeroBackdrop({ account, insetsTop }: DashboardBackgroundsProps) {
  const HERO_HEIGHT = DASHBOARD_LAYOUT.HERO_HEIGHT;
  
  return useMemo(() => (
    <LinearGradient
      key={account}
      colors={ACCOUNT_GRADS[account]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: HERO_HEIGHT + insetsTop + 5,
        zIndex: 0,
      }}
      pointerEvents="none"
    />
  ), [account, insetsTop]);
}

/**
 * Backdrop para la zona del menú (Drawer)
 */
export function MenuBackdrop({ account, insetsTop }: DashboardBackgroundsProps) {
  const MENU_GRAD_H = DASHBOARD_LAYOUT.MENU_GRADIENT_HEIGHT;
  
  return useMemo(() => (
    <LinearGradient
      key={`menu-${account}`}
      colors={ACCOUNT_GRADS[account]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: insetsTop + MENU_GRAD_H,
        zIndex: 0,
      }}
      pointerEvents="none"
    />
  ), [account, insetsTop]);
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

