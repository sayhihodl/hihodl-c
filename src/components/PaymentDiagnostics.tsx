// src/components/PaymentDiagnostics.tsx
// Componente para mostrar problemas y soluciones de diagnóstico de pagos
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { DiagnosticResult } from "@/services/paymentDiagnostics";
import type { SolutionAction } from "@/services/paymentDiagnostics";

type Props = {
  diagnostic: DiagnosticResult;
  onSolutionPress?: (action: SolutionAction, metadata?: any) => void;
  compact?: boolean;
};

export default function PaymentDiagnostics({ diagnostic, onSolutionPress, compact = false }: Props) {
  if (diagnostic.problem === null) {
    // Todo OK, no mostrar nada
    return null;
  }

  const severityColors = {
    critical: { bg: "rgba(255,107,107,0.15)", border: "rgba(255,107,107,0.3)", text: "#FF6B6B", icon: "alert-circle" },
    warning: { bg: "rgba(255,183,3,0.15)", border: "rgba(255,183,3,0.3)", text: "#FFB703", icon: "warning" },
    info: { bg: "rgba(156,180,193,0.15)", border: "rgba(156,180,193,0.3)", text: "#9CB4C1", icon: "information-circle" },
  };

  const colors = severityColors[diagnostic.severity];

  const handleSolutionPress = (solution: DiagnosticResult["solutions"][0]) => {
    if (onSolutionPress) {
      onSolutionPress(solution.action, diagnostic.metadata);
      return;
    }

    // Default navigation handlers
    switch (solution.action) {
      case "request_payment":
        router.push({
          pathname: "/(drawer)/(internal)/payments/quick-request",
          params: diagnostic.metadata?.recipient ? { to: diagnostic.metadata.recipient } : {},
        });
        break;
      
      case "buy_crypto":
        // Asumiendo que existe una ruta de compra
        router.push("/(drawer)/(tabs)/buy" as any);
        break;
      
      case "swap_tokens":
        router.push({
          pathname: "/(drawer)/(tabs)/swap",
          params: diagnostic.metadata?.otherTokens?.[0] 
            ? {
                fromToken: diagnostic.metadata.otherTokens[0].tokenId,
                fromChain: diagnostic.metadata.otherTokens[0].chain,
              }
            : {},
        });
        break;
      
      case "change_chain":
        // Esto debería ser manejado por el componente padre (ej: abrir selector de token)
        if (diagnostic.metadata?.alternatives?.[0]) {
          // El componente padre debería manejar esto
          console.log("[PaymentDiagnostics] Change chain to", diagnostic.metadata.alternatives[0].chain);
        }
        break;
      
      case "auto_bridge":
        // El componente padre debería manejar el auto-bridge
        // Esto podría disparar un flujo especial de envío que haga bridge automático
        console.log("[PaymentDiagnostics] Auto-bridge plan:", diagnostic.metadata?.autoBridgePlan);
        // El componente padre ejecutará el envío con bridge automático
        break;
      
      case "receive_funds":
        router.push("/(drawer)/(internal)/receive" as any);
        break;
      
      case "wait":
        // No hacer nada, solo esperar
        break;
      
      case "retry":
        // El componente padre debería manejar el retry
        break;
    }
  };

  if (compact) {
    // Versión compacta: solo mensaje + botón primario
    const primarySolution = diagnostic.solutions[0];
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.bg, borderColor: colors.border }]}>
        <View style={styles.compactRow}>
          <Ionicons name={colors.icon as any} size={16} color={colors.text} />
          <Text style={[styles.compactMessage, { color: colors.text }]} numberOfLines={1}>
            {diagnostic.message}
          </Text>
        </View>
        {primarySolution && (
          <Pressable
            onPress={() => handleSolutionPress(primarySolution)}
            style={[styles.compactButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.compactButtonText, { color: colors.text }]}>
              {primarySolution.label}
            </Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Versión completa: mensaje + todas las soluciones
  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name={colors.icon as any} size={20} color={colors.text} />
        <Text style={[styles.message, { color: colors.text }]}>
          {diagnostic.message}
        </Text>
      </View>

      {diagnostic.solutions.length > 0 && (
        <View style={styles.solutions}>
          {diagnostic.solutions.map((solution, idx) => (
            <Pressable
              key={`${solution.action}-${idx}`}
              onPress={() => handleSolutionPress(solution)}
              style={[styles.solutionButton, { borderColor: colors.border }]}
            >
              {solution.icon && (
                <Ionicons 
                  name={solution.icon as any} 
                  size={18} 
                  color={colors.text} 
                  style={{ marginRight: 8 }} 
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.solutionLabel, { color: colors.text }]}>
                  {solution.label}
                </Text>
                <Text style={[styles.solutionDescription, { color: colors.text, opacity: 0.7 }]}>
                  {solution.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text} style={{ opacity: 0.5 }} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  solutions: {
    gap: 8,
  },
  solutionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  solutionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  solutionDescription: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Compact version
  compactContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    marginVertical: 4,
  },
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  compactMessage: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    flex: 1,
  },
  compactButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: "700",
  },
});

