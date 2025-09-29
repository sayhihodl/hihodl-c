import React from "react";
import NativeModalCard from "./NativeModalCard";

/**
 * Compat wrapper para la API antigua de <BottomSheet />
 * Soporta las props heredadas pero renderiza el nuevo modal nativo.
 */
type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;

  // props antiguas (se ignoran o se mapean cuando aplica)
  title?: string;
  subtitle?: string;
  maxHeightPct?: number;          // ignorada: el modal calcula alto automáticamente
  backgroundColor?: string;       // ignorada: usamos el theme del modal
  showHandle?: boolean;           // ignorada (solo estética del antiguo sheet)
  draggableFromHandleOnly?: boolean; // ignorada
  testID?: string;
};

export default function CompatBottomSheet({
  visible,
  onClose,
  children,
  title = "",
  subtitle,
  testID,
}: Props) {
  return (
    <NativeModalCard
      visible={visible}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      // backdrop cierra por defecto; si quieres bloquearlo
      // añade prop closeOnBackdrop={false} en NativeModalCard y pásala aquí.
      testID={testID}
    >
      {children}
    </NativeModalCard>
  );
}