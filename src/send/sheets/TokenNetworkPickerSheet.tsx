import React from "react";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import StepToken from "@/send/steps/StepToken";
import type { ChainKey } from "@/send/types";

export default function TokenNetworkPickerSheet({
  visible,
  title,
  selectedChain,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  selectedChain?: ChainKey;
  onPick: (args: { tokenId: string; bestNet: ChainKey }) => void;
  onClose: () => void;
}) {
  return (
    <BottomKeyboardModal
      visible={visible}
      onClose={onClose}
      blurIntensity={40}
      minHeightPct={0.60}
      maxHeightPct={0.9}
      dragAnywhere
    >
      {/* Reutilizamos StepToken dentro del sheet (tiene su header propio) */}
      <StepToken
        title={title}
        selectedChain={selectedChain}
        onBack={onClose}
        onPick={(sel) => {
          onPick(sel);
          onClose();
        }}
      />
    </BottomKeyboardModal>
  );
}