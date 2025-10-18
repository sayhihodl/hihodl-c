import React from "react";
import { View, Text } from "react-native";
import { useSendFlow } from "./SendFlowProvider";

export default function SendScreenBody() {
  const { step, state } = useSendFlow();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>SendScreenBody — step: {step}</Text>
      <Text>amount: {state.amount ?? "-"}</Text>
    </View>
  );
}