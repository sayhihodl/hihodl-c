import React from "react";
import NativeModalCard from "./NativeModalCard";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: number;
  primaryAction?: { label: string; onPress: () => void; disabled?: boolean } | null;
  secondaryAction?: { label: string; onPress: () => void } | null;
  closeOnBackdrop?: boolean;
  testID?: string;
};

export default function ControlledBottomSheet({
  visible,
  onClose,
  title = "",
  subtitle,
  children,
  maxWidth,
  primaryAction,
  secondaryAction,
  closeOnBackdrop = true,
  testID,
}: Props) {
  return (
    <NativeModalCard
      visible={visible}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      closeOnBackdrop={closeOnBackdrop}
      primary={primaryAction ?? undefined}
      secondary={secondaryAction ?? { label: "Close", onPress: onClose }}
      maxWidth={maxWidth}
      testID={testID}
    >
      {children}
    </NativeModalCard>
  );
}