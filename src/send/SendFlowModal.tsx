// SendFlowModal.tsx
import React, { useMemo } from "react";
import { View } from "react-native";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import StepSearch from "./steps/StepSearch";

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  step: "search" | "token" | "amount" | "confirm";
};

const Placeholder = () => <View style={{ height: 1 }} />;

export default function SendFlowModal({ visible, onRequestClose, step }: Props) {
  const body = useMemo(() => {
    switch (step) {
      case "search":  return <StepSearch />;
      case "token":   return <Placeholder />;
      case "amount":  return <Placeholder />;
      case "confirm": return <Placeholder />;
      default:        return <StepSearch />;
    }
  }, [step]);

  return (
    <BottomKeyboardModal
      visible={visible}
      onClose={onRequestClose}
      scrimOpacity={0.5}              // <- antes era backdropOpacity
      blurIntensity={40}
      glassTintRGBA="rgba(10,20,28,0.98)"
      showHandle
      dragAnywhere
      dragCloseThreshold={96}
      minHeightPct={0.78}
      maxHeightPct={0.92}
      tapToDismissKeyboard
    >
      {body}
    </BottomKeyboardModal>
  );
}