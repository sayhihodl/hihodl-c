// app/(drawer)/(tabs)/send/index.tsx
import React, { useMemo } from "react";
import { SafeAreaView, View, StyleSheet } from "react-native";
import { FlowProvider, useSendFlow } from "@/send/SendFlowProvider";
import StepSearch from "@/send/steps/StepSearch";

function SendScreenBody() {
  const { state } = useSendFlow();

  const body = useMemo(() => {
    switch (state.step) {
      case "search": return <StepSearch />;
      // TODO: tus otros pasos
      case "token":  return <View style={{ height: 1 }} />;
      case "amount": return <View style={{ height: 1 }} />;
      case "confirm":return <View style={{ height: 1 }} />;
      default:       return <StepSearch />;
    }
  }, [state.step]);

  return <SafeAreaView style={styles.container}>{body}</SafeAreaView>;
}

export default function SendRoute() {
  return (
    <FlowProvider>
      <SendScreenBody />
    </FlowProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "transparent" },
});