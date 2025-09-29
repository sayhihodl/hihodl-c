
import React, { memo } from "react";
import { View, Text, StyleSheet, Image, Platform, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path, Defs, RadialGradient, Stop, Rect } from "react-native-svg";

type Scheme = "visa" | "mastercard" | "none";

export type StableCardProps = {
  /** Nombre del emisor (arriba izq). Para HiHODL pon “HIHODL” o el logo más tarde. */
  issuer?: string;
  /** Etiqueta arriba derecha (e.g. “DÉBITO”, “PREMIUM”) */
  topRightLabel?: string;
  /** Últimos 4 (o 2) dígitos a mostrar */
  last4?: string;
  /** Esquema de red para el logo de la esquina inferior derecha */
  scheme?: Scheme;
  /** Color base del fondo (teal por defecto) */
  tint?: string;
  /** Segundo color para el gradiente */
  tint2?: string;
  /** Marca/monograma central en relieve (string -> letra o símbolo) */
  mono?: string;
  /** Tamaño: “s”, “m”, “l” */
  size?: "s" | "m" | "l";
  /** Estilo extra del contenedor */
  style?: ViewStyle;
};

const SIZE_MAP = {
  s: { w: 280, h: 176 },  // ratio 1.59 aprox
  m: { w: 320, h: 200 },
  l: { w: 360, h: 225 },
};

const StableCard = memo<StableCardProps>(function StableCard({
  issuer = "HIHODL",
  topRightLabel = "DEBIT",
  last4 = "",
  scheme = "Visa",
  tint = "#1CB5B2",
  tint2 = "#0996A2",
  mono = "A",            // luego lo cambiamos por el alien/mark
  size = "m",
  style,
}) {
  const { w, h } = SIZE_MAP[size];

  return (
    <View style={[{ width: w, height: h }, style]}>
      {/* Fondo redondeado con gradiente + “sheen” sutil */}
      <LinearGradient
        colors={[tint, tint2]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.card, { borderRadius: 18 }]}
      />
      {/* Vignette sutil y ruido radial para que no se vea plano */}
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="rg" cx="50%" cy="0%" r="90%">
            <Stop offset="0%" stopOpacity="0.25" stopColor="#ffffff" />
            <Stop offset="70%" stopOpacity="0.08" stopColor="#ffffff" />
            <Stop offset="100%" stopOpacity="0" stopColor="#ffffff" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#rg)" />
      </Svg>

      {/* Borde + inner shadow muy suave */}
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: 18,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(255,255,255,0.18)",
          },
        ]}
      />

      {/* Ondas NFC (relieve) */}
      <Svg
        width={40}
        height={28}
        style={{ position: "absolute", top: 16, left: 16, opacity: 0.5 }}
      >
        <Path
          d="M3 14c4-6 10-6 14 0M7 14c3-4 7-4 10 0M11 14c2-2 4-2 6 0"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </Svg>

      {/* Issuer (arriba izq) */}
      <Text style={styles.issuer}>{issuer}</Text>

      {/* Etiqueta arriba dcha */}
      {!!topRightLabel && (
        <Text style={styles.topRight}>{topRightLabel}</Text>
      )}

      {/* Monograma/mark centrado (relieve “grabado”) */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[
          styles.mono,
          {
            fontSize: h * 0.55,
            opacity: 0.16,
          },
        ]}
      >
        {mono}
      </Text>

      {/* Línea “embossed” atravesando la tarjeta (detalle sutil como en la foto) */}
      <View
        style={{
          position: "absolute",
          top: h * 0.48,
          left: 0,
          right: 0,
          height: 2,
          backgroundColor: "rgba(255,255,255,0.14)",
          opacity: 0.25,
        }}
      />

      {/* Número parcial */}
      <View style={{ position: "absolute", left: 20, bottom: 24, flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={styles.dot}>• • • •</Text>
        <Text style={styles.last4}>{last4}</Text>
      </View>

      {/* Logo esquema (abajo dcha). Colocamos placeholder vectorial simple, luego lo cambiamos por assets. */}
      {scheme !== "none" && (
        <Text style={styles.scheme}>{scheme.toUpperCase()}</Text>
      )}
    </View>
  );
});

export default StableCard;

/* ============ estilos ============ */
const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    ...Platform.select({
      android: { elevation: 6 },
      ios: { shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 8 } },
      default: {},
    }),
  },
  issuer: {
    position: "absolute",
    top: 16,
    left: 20,
    color: "rgba(255,255,255,0.95)",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  topRight: {
    position: "absolute",
    top: 18,
    right: 20,
    color: "rgba(255,255,255,0.95)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  mono: {
    position: "absolute",
    alignSelf: "center",
    top: "22%",
    color: "#000",
    fontWeight: "800",
    textAlign: "center",
    textShadowColor: "rgba(255,255,255,0.25)",
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  dot: {
    color: "rgba(255,255,255,0.90)",
    fontWeight: "800",
    letterSpacing: 2,
    fontSize: 18,
  },
  last4: {
    color: "rgba(255,255,255,0.95)",
    fontWeight: "800",
    fontSize: 20,
    letterSpacing: 1,
  },
  scheme: {
    position: "absolute",
    right: 18,
    bottom: 18,
    color: "rgba(255,255,255,0.92)",
    fontWeight: "900",
    fontSize: 22,
    letterSpacing: 1,
  },
});