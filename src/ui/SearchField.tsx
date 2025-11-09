import React, { forwardRef, useEffect, useRef } from "react";
import { View, TextInput, Pressable, StyleSheet, TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { parseRecipient, isSendableAddress } from "@/send/parseRecipient";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  height?: number;
  onPaste?: () => void;
  onClear?: () => void;
  containerStyle?: any;
  inputProps?: TextInputProps;
  enableAddressDetection?: boolean; // Habilita la detección automática de direcciones
};

const SearchField = forwardRef<TextInput, Props>(({
  value, onChangeText, placeholder, height = 36, onPaste, onClear, containerStyle, inputProps,
  enableAddressDetection = false,
}, ref) => {
  const detectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<TextInput>(null);
  
  // Combinar refs: forwardRef + ref interno
  useEffect(() => {
    if (typeof ref === 'function') {
      ref(inputRef.current);
    } else if (ref) {
      (ref as any).current = inputRef.current;
    }
  }, [ref]);

  // Detectar cuando se pega/escribe una dirección válida
  useEffect(() => {
    if (!enableAddressDetection) return;

    // Limpiar timeout anterior
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current);
    }

    if (!value.trim()) return;

    // Esperar un poco para que el usuario termine de pegar/escribir
    detectTimeoutRef.current = setTimeout(() => {
      const trimmed = value.trim();
      if (!trimmed) return;

      // Verificar si es una dirección sendable
      if (isSendableAddress(trimmed)) {
        const parsed = parseRecipient(trimmed);
        if (!parsed) return;

        // Navegar al flujo de send con los parámetros correctos
        let toRaw = parsed.toRaw;
        let toChain = parsed.toChain || parsed.resolved?.chain;

        // Para EVM addresses, permitir múltiples chains (base, polygon, ethereum)
        if (parsed.kind === "evm") {
          // Por defecto usar ethereum, pero el flujo de send permitirá elegir base/polygon también
          toChain = toChain || "ethereum";
        }

        // Para card numbers: navegar al flujo de card payment
        if (parsed.kind === "phone" && /^\d{13,19}$/.test(trimmed.replace(/[\s-]/g, ""))) {
          router.push({
            pathname: "/(internal)/send",
            params: {
              kind: "card",
              to: parsed.toRaw,
            },
          });
          onChangeText("");
          return;
        }

        // Para wallets, usuarios HiHODL e IBAN: navegar a token-select
        // (IBAN también permite elegir stablecoin y el backend maneja el off-ramp)
        const addr = parsed.resolved?.address ?? parsed.toRaw;
        router.push({
          pathname: "/(drawer)/(tabs)/send/token-select",
          params: {
            toType: parsed.kind,
            toRaw: toRaw,
            display: addr,
            ...(toChain ? { chain: toChain } : {}),
            ...(parsed.resolved?.address ? { resolved: parsed.resolved.address } : {}),
          } as any,
        });

        // Limpiar el search field después de navegar
        onChangeText("");
      }
    }, 500); // Esperar 500ms después de que el usuario deje de escribir

    return () => {
      if (detectTimeoutRef.current) {
        clearTimeout(detectTimeoutRef.current);
      }
    };
  }, [value, enableAddressDetection, onChangeText]);

  return (
    <View style={[styles.searchBar, { height }, containerStyle]}>
      <Ionicons name="search" size={16} color="#8FD3E3" />
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.45)"
        style={styles.searchInput}
        returnKeyType="search"
        {...inputProps}
      />
      {onPaste && (
        <Pressable onPress={onPaste} hitSlop={8} accessibilityLabel="Paste">
          <Ionicons name="clipboard-outline" size={16} color="#8FD3E3" />
        </Pressable>
      )}
      {!!value && onClear && (
        <Pressable onPress={onClear} hitSlop={8} accessibilityLabel="Clear">
          <Ionicons name="close-circle" size={16} color="#8FD3E3" />
        </Pressable>
      )}
    </View>
  );
});

SearchField.displayName = "SearchField";

export default SearchField;

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    paddingHorizontal: 10,
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.08)",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
    fontWeight: "400",
    letterSpacing: -0.2,
  },
});