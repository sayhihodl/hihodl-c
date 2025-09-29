// src/components/LoadingButton.tsx
import React from "react";
import { Pressable, Text } from "react-native";
import HiHodlSpinner from "./HiHodlSpinner";

type Props = {
  title: string;
  loading?: boolean;
  onPress?: () => void;
  disabled?: boolean;
};

export function LoadingButton({ title, loading = false, onPress, disabled = false }: Props) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={loading ? undefined : onPress}
      style={{
        height: 48,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFB703",
        opacity: isDisabled ? 0.6 : 1,
      }}
      disabled={isDisabled}
    >
      {loading ? (
        <HiHodlSpinner size={20} />
      ) : (
        <Text style={{ color: "#0F0F1A", fontWeight: "800" }}>{title}</Text>
      )}
    </Pressable>
  );
}