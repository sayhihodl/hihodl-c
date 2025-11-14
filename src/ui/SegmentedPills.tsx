// ui/SegmentedPills.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from "react-native";

export type PillItem = { id: string; label: string };

export type SegmentedPillsProps = {
  items: ReadonlyArray<PillItem>;
  activeIndex: number;
  onPress: (index: number, item: PillItem) => void;

  /** Progreso opcional que mueve el indicador (p.ej. Animated.divide / position+offset) */
  progress?: Animated.AnimatedInterpolation<number> | Animated.Value | any;

  height?: number;
  pillMinWidth?: number;
  pillHPad?: number;
  wrapHPad?: number;

  style?: ViewStyle;
  textStyle?: TextStyle;
  activeTextStyle?: TextStyle;
  indicatorStyle?: ViewStyle;
  wrapBackground?: string;

  /** duración de la animación cuando NO hay `progress` */
  animateMs?: number;
};

export default function SegmentedPills({
  items,
  activeIndex,
  onPress,
  progress,
  height = 44,
  pillMinWidth = 68,
  pillHPad = 16,
  wrapHPad = 8,
  style,
  textStyle,
  activeTextStyle,
  indicatorStyle,
  wrapBackground = "rgba(255,255,255,0.08)",
  animateMs = 160,
}: SegmentedPillsProps) {
  const [labelW, setLabelW] = useState<number[]>(Array(items.length).fill(0));
  const [btnMeasures, setBtnMeasures] = useState<{ x: number; w: number }[]>(
    Array(items.length).fill({ x: 0, w: 0 })
  );
  const [containerW, setContainerW] = useState(0);
  
  // Medir texto invisible primero para obtener el ancho real
  const [measuring, setMeasuring] = useState(true);

  // AVs internos para el caso SIN progress
  const leftAV = useRef(new Animated.Value(0)).current;
  const widthAV = useRef(new Animated.Value(0)).current;

  const computedBtnWidths = useMemo(() => {
    if (!containerW || labelW.some((w) => w <= 0)) return null;
    const usable = containerW - wrapHPad * 2;
    
    // Calcular el ancho deseado para cada botón (texto + padding)
    // Asegurar que cada botón tenga al menos el espacio necesario para su texto completo
    const desired = labelW.map((w) => {
      // Añadir padding y un pequeño margen extra para evitar truncamiento
      const minNeeded = w + pillHPad * 2 + 4; // +4px de margen de seguridad
      return Math.max(pillMinWidth, minNeeded);
    });
    
    const sum = desired.reduce((a, b) => a + b, 0);
    
    // Si el espacio disponible es suficiente, usar los anchos deseados
    if (sum <= usable) {
      // Distribuir cualquier espacio extra equitativamente
      const extra = usable - sum;
      const perPill = Math.floor(extra / desired.length);
      const remainder = extra % desired.length;
      return desired.map((w, i) => w + perPill + (i < remainder ? 1 : 0));
    }
    
    // Si no cabe, escalar proporcionalmente pero asegurar que cada uno tenga al menos pillMinWidth
    const scale = usable / sum;
    const scaled = desired.map((w) => Math.max(pillMinWidth, Math.round(w * scale)));
    const scaledSum = scaled.reduce((a, b) => a + b, 0);
    let diff = usable - scaledSum;
    
    // Ajustar diferencias menores distribuyendo el espacio extra/faltante
    let i = 0;
    while (diff !== 0 && i < scaled.length * 2) {
      const idx = i % scaled.length;
      const step = diff > 0 ? 1 : -1;
      if (scaled[idx] + step >= pillMinWidth) {
        scaled[idx] += step;
        diff -= step;
      }
      i++;
    }
    
    return scaled;
  }, [containerW, labelW, wrapHPad, pillHPad, pillMinWidth]);

  // Indicador: con progress usa interpolaciones, sin progress anima hacia el pill activo
  const left =
    progress && btnMeasures.every((m) => m.w > 0)
      ? (progress as any).interpolate({
          inputRange: items.map((_, i) => i),
          outputRange: btnMeasures.map((m) => m.x),
          extrapolate: "clamp",
        })
      : leftAV;

  const width =
    progress && btnMeasures.every((m) => m.w > 0)
      ? (progress as any).interpolate({
          inputRange: items.map((_, i) => i),
          outputRange: btnMeasures.map((m) => m.w),
          extrapolate: "clamp",
        })
      : widthAV;

  // Si NO hay progress, animar cuando cambie activeIndex (cuando ya tengamos medidas)
  useEffect(() => {
    if (progress) return; // el pager controla
    const m = btnMeasures[activeIndex];
    if (!m || m.w <= 0) return;
    Animated.parallel([
      Animated.timing(leftAV, { toValue: m.x, duration: animateMs, useNativeDriver: false }),
      Animated.timing(widthAV, { toValue: m.w, duration: animateMs, useNativeDriver: false }),
    ]).start();
  }, [activeIndex, btnMeasures, progress, leftAV, widthAV, animateMs]);

  // Medir textos primero de forma invisible
  useEffect(() => {
    if (measuring && labelW.every((w) => w > 0)) {
      setMeasuring(false);
    }
  }, [measuring, labelW]);

  return (
    <>
      {/* Textos invisibles para medir el ancho real - usar el estilo más ancho (activo) */}
      {measuring && (
        <View style={{ position: "absolute", opacity: 0, pointerEvents: "none", zIndex: -1, width: 1000 }}>
          {items.map((item, i) => (
            <Text
              key={`measure-${item.id}`}
              style={[
                styles.txt, 
                textStyle, 
                styles.txtActive, // Usar estilo activo (más ancho) para medir
                activeTextStyle
              ]}
              allowFontScaling={false}
              onLayout={(e) => {
                const lw = e.nativeEvent.layout.width;
                if (lw > 0) {
                  setLabelW((prev) => {
                    const next = [...prev];
                    // Usar el máximo entre el estilo normal y activo para asegurar espacio suficiente
                    if (next[i] === 0 || lw > next[i]) {
                      next[i] = lw;
                    }
                    return next;
                  });
                }
              }}
            >
              {item.label}
            </Text>
          ))}
        </View>
      )}
      
      <View
        style={[
          styles.wrap,
          { height, paddingHorizontal: wrapHPad, backgroundColor: wrapBackground },
          style,
        ]}
        onLayout={(e) => setContainerW(e.nativeEvent.layout.width)}
      >
        <Animated.View style={[styles.indicator, { left, width }, indicatorStyle]} />

        {items.map((item, i) => {
          const active = i === activeIndex;
          const w = computedBtnWidths?.[i];

          return (
            <Pressable
              key={item.id}
              onPress={() => onPress(i, item)}
              style={[styles.btn, w ? { width: w } : null]}
              onLayout={(e) => {
                const { x, width: bw } = e.nativeEvent.layout;
                setBtnMeasures((prev) => {
                  const next = [...prev];
                  if (next[i]?.x === x && next[i]?.w === bw) return prev;
                  next[i] = { x, w: bw };
                  return next;
                });
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text
                style={[styles.txt, textStyle, active && styles.txtActive, active && activeTextStyle]}
                numberOfLines={1}
                allowFontScaling={false}
                adjustsFontSizeToFit={false}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  btn: {
    height: "100%",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  txt: { 
    color: "rgba(159,179,191,0.9)", 
    fontWeight: "700", 
    fontSize: 14,
    letterSpacing: 0.2,
  },
  txtActive: { 
    color: "#FFFFFF",
    fontWeight: "800",
  },
});