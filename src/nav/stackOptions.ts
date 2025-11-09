// src/nav/stackOptions.ts
import { Platform } from "react-native";
import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { legacy as legacyColors } from "@/theme/colors";

const { BG = "#0D1820" } = legacyColors;

/** Helpers tipados para animaciones y presentación */
type Anim = NonNullable<NativeStackNavigationOptions["animation"]>;
type Pres = NonNullable<NativeStackNavigationOptions["presentation"]>;

/** Animación estándar para pushes (detalle) */
const pushAnimation: Anim = Platform.select<Anim>({
  ios: "slide_from_right",
  android: "fade",           // usa "slide_from_right" si prefieres
  default: "fade",
})!;

/** Animación estándar para modales */
const modalAnimation: Anim = Platform.select<Anim>({
  ios: "slide_from_bottom",
  android: "fade",           // "fade_from_bottom" no existe en native-stack
  default: "fade",
})!;

/** Presentations tipadas */
const modalPresentation: Pres = "modal";
const transparentModalPresentation: Pres = "transparentModal";

/** 
 * Transición estándar tipo "push" (detalles, flows normales)
 */
export const pushOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: BG }, // evita flash blanco
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  gestureDirection: "horizontal",
  animation: pushAnimation,
  headerBackButtonMenuEnabled: false, // Fix para evitar conflictos con beforeRemove
};

/**
 * Modal clásico (con fondo opaco para evitar flashes)
 */
export const modalOptions: NativeStackNavigationOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: BG },
  gestureEnabled: true,
  fullScreenGestureEnabled: true,
  gestureDirection: "vertical",
  presentation: modalPresentation,
  animation: modalAnimation,
};

/**
 * Modal transparente (solo si necesitas overlay real con blur/glass)
 */
export const transparentModalOptions: NativeStackNavigationOptions = {
  ...modalOptions,
  contentStyle: { backgroundColor: "transparent" },
  presentation: transparentModalPresentation,
};