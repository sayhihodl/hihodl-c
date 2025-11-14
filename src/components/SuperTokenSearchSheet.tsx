// src/components/SuperTokenSearchSheet.tsx
// Componente reutilizable para búsqueda avanzada de tokens multi-chain
import React, { useState, useRef, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, TextInput } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import BottomKeyboardModal from "@/components/BottomSheet/BottomKeyboardModal";
import StepToken from "@/send/steps/StepToken";
import { coercePair, bestChainForToken, type ChainKey } from "@/config/sendMatrix";
import type { TextInput as RNTextInput } from "react-native";

export type SuperTokenSearchSheetProps = {
  visible: boolean;
  onClose: () => void;
  onPick: (params: { tokenId: string; chain: ChainKey; symbol?: string; name?: string }) => void;
  
  // Opciones de configuración
  title?: string;
  selectedChain?: ChainKey;
  placeholder?: string;
  
  // Destinatario para personalización (último token usado con este destinatario será segunda opción)
  recipient?: string;
  
  // Control de drag (para integración con modales que se cierran al arrastrar)
  dragGateRef?: React.MutableRefObject<boolean>;
  onTopChange?: (atTop: boolean) => void;
  
  // Estilo personalizado
  minHeightPct?: number;
  maxHeightPct?: number;
};

export default function SuperTokenSearchSheet({
  visible,
  onClose,
  onPick,
  title = "Select currency",
  selectedChain,
  placeholder = "Search currency…",
  recipient,
  dragGateRef,
  onTopChange,
  minHeightPct = 0.88,
  maxHeightPct = 0.94,
}: SuperTokenSearchSheetProps) {
  const [tokenSearch, setTokenSearch] = useState("");
  const tokenSearchRef = useRef<RNTextInput>(null);
  const internalDragGateRef = useRef<boolean>(true);
  const gateRef = dragGateRef || internalDragGateRef;

  // ChainKey seguro para el sheet (evita error de tipos)
  const selectedForSheet = useMemo<ChainKey>(() => {
    if (selectedChain) return selectedChain;
    return (bestChainForToken("usdc") || "solana") as ChainKey;
  }, [selectedChain]);

  const handlePick = ({ tokenId: id, bestNet, symbol, name }: { tokenId: string; bestNet: ChainKey; symbol?: string; name?: string }) => {
    const norm = id.toLowerCase();
    const fixed = coercePair(norm, bestNet);
    onPick({ tokenId: norm, chain: fixed, symbol, name });
    setTokenSearch("");
    onClose();
  };

  const handleTopChange = (atTop: boolean) => {
    gateRef.current = atTop;
    onTopChange?.(atTop);
  };

  return (
    <BottomKeyboardModal
      visible={visible}
      onClose={onClose}
      minHeightPct={minHeightPct}
      maxHeightPct={maxHeightPct}
      scrimOpacity={0.85}
      sheetTintRGBA="rgba(2,48,71,0.28)"
      blurTopOnly={false}
      blurTopHeight={48}
      dismissOnScrimPress
      ignoreKeyboard
      dragAnywhere={false}
      dragGateRef={gateRef}
      header={{
        height: 98,
        innerTopPad: -32,
        sideWidth: 45,
        centerWidthPct: 92,
        blurTint: "dark",
        showHandleTop: true,
        centerHeaderContent: true,
        center: (
          <View style={{ width: "100%", alignItems: "center" }}>
            <Text style={styles.headerTitle}>{title}</Text>

            {/* Search bar mejorado */}
            <View style={styles.searchContainer}>
              <BlurView tint="dark" intensity={50} style={StyleSheet.absoluteFill} />
              <Pressable
                style={styles.searchRow}
                onPress={() => tokenSearchRef.current?.focus()}
                hitSlop={8}
              >
                <Ionicons name="search" size={18} color="#9CB4C1" />
                <TextInput
                  ref={tokenSearchRef}
                  value={tokenSearch}
                  onChangeText={setTokenSearch}
                  placeholder={placeholder}
                  placeholderTextColor="#9CB4C1"
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {!!tokenSearch && (
                  <Pressable onPress={() => setTokenSearch("")} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color="#9CB4C1" />
                  </Pressable>
                )}
              </Pressable>
            </View>
          </View>
        ),
      }}
    >
      <StepToken
        title=""
        useExternalHeader
        searchValue={tokenSearch}
        onChangeSearch={setTokenSearch}
        searchInputRef={tokenSearchRef}
        selectedChain={selectedForSheet}
        recipient={recipient}
        onBack={onClose}
        onTopChange={handleTopChange}
        onPick={handlePick}
      />
    </BottomKeyboardModal>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  searchContainer: {
    position: "relative",
    borderRadius: 14,
    overflow: "hidden",
    height: 44,
    width: "100%",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
  },
  searchRow: {
    flex: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
  },
});


