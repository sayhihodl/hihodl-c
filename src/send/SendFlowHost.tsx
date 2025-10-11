// src/send/SendFlowHost.tsx
import React, { useMemo, useRef } from "react";
import { View, StyleSheet } from "react-native";
import BottomSheet from "@/components/BottomSheet/BottomKeyboardModal";
import { useSendFlow } from "./SendFlowProvider";
import StepSearch from "@/send/steps/StepSearch";
import StepToken from "@/send/steps/StepToken";
import StepAmount from "@/send/steps/StepAmount"; // 👈 render real del step amount
import type { ChainKey } from "@/send/types";
import { glass } from "@/theme/colors";

const Placeholder = () => <View style={{ height: 1 }} />;

function toAccountCap(a?: string): "Daily" | "Savings" | "Social" {
  const v = (a ?? "daily").toLowerCase();
  if (v === "savings") return "Savings";
  if (v === "social")  return "Social";
  return "Daily";
}

export default function SendFlowHost() {
  const { state, patch, goTo, close } = useSendFlow();
  const dragGateRef = useRef<boolean>(true);

  const body = useMemo(() => {
    switch (state.step) {
      case "search":
        return <StepSearch dragGateRef={dragGateRef} />;

      case "token": {
        const title = state.toDisplay ?? state.label ?? state.toRaw ?? "Recipient";
        return (
          <StepToken
            title={title}
            account={toAccountCap(state.account)}
            selectedChain={state.chain as ChainKey | undefined}
            // 👇 el propio StepToken ya hace goTo("amount") tras patch;
            // aquí solo persistimos por si se usa onPick para analytics.
            onPick={({ tokenId, bestNet }) => {
              patch({ tokenId, chain: bestNet });
            }}
            onBack={() => goTo("search")}
          />
        );
      }

      case "amount":
        return <StepAmount />; // 👈 ahora sí montamos el StepAmount

      case "confirm":
        return <Placeholder />;

      default:
        return <StepSearch dragGateRef={dragGateRef} />;
    }
  }, [
    state.step,
    state.toDisplay,
    state.label,
    state.toRaw,
    state.account,
    state.chain,
    patch,
    goTo,
  ]);

  return (
    <BottomSheet
      visible={state.open}
      onClose={close}
      minHeightPct={0.92}
      maxHeightPct={0.92}
      blurIntensity={100}
      glassTintRGBA={glass.sheetTint}
      scrimOpacity={0}
      dragCloseThreshold={140}
      showHandle
      dragGateRef={dragGateRef}
      ignoreKeyboard
    >
      <View style={styles.sheetContent}>{body}</View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetContent: { flex: 1, paddingBottom: 8 },
});