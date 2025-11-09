import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Tile, TileRow2Up } from "@/ui/Tile";

type Props = {
  onRequest?: () => void;
  onScan?: () => void;
  onGroup?: () => void;
};

export default function PaymentComposer({
  onRequest, onScan, onGroup,
}: Props) {
  const { bottom } = useSafeAreaInsets();

  return (
    <>
      {/* BODY - Contenido scrolleable */}
      <View style={[styles.wrap, { paddingTop: 12, paddingBottom: Math.max(20, bottom ? 20 : 0) }]}>
        {/* Actions Grid - usando Tile y TileRow2Up */}
        <TileRow2Up style={{ marginBottom: 12 }}>
          <Tile
            icon="cash"
            title="Bank"
            tint="rgba(143,211,227,0.20)"
            onPress={() => {}}
          />
          <Tile
            icon="card"
            title="Card"
            tint="rgba(143,211,227,0.20)"
            onPress={() => {}}
          />
        </TileRow2Up>
        
        <TileRow2Up style={{ marginBottom: 12 }}>
          <Tile
            icon="link"
            title="Request / Link"
            tint="rgba(143,211,227,0.20)"
            onPress={onRequest}
          />
          <Tile
            icon="people"
            title="Group / Split"
            tint="rgba(143,211,227,0.20)"
            onPress={() => { (onGroup || (() => router.push('/(drawer)/(internal)/payments/create-group')))(); }}
          />
        </TileRow2Up>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: "transparent",
    ...(Platform.OS === "android" && {
      backgroundColor: "#0D1820", // Fondo sólido para Android para evitar capa blanca
    }),
  },
});