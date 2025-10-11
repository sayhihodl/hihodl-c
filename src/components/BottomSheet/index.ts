// src/components/BottomSheet/index.ts

// 👉 Importa SIEMPRE el BottomSheet así:
//   import BottomSheet from "@/components/BottomSheet/BottomSheet"

// Exporta compat wrappers y tipos si los necesitas
export { default as CompatBottomSheet } from "./CompatBottomSheet";
export { default as ControlledBottomSheet } from "./ControlledBottomSheet";
export { default as NativeModalCard } from "./NativeModalCard";

// Opcional: tipos (solo si los usas en la app)
export type { BottomSheetProps } from "./BottomKeyboardModal";