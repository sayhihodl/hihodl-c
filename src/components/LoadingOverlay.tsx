import React from "react";
import { Modal, View } from "react-native";
import HiHodlSpinner from "./HiHodlSpinner";

export function LoadingOverlay({ visible }: { visible: boolean }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" }}>
        <HiHodlSpinner size={42} />
      </View>
    </Modal>
  );
}