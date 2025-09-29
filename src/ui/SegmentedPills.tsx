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

  // AVs internos para el caso SIN progress
  const leftAV = useRef(new Animated.Value(0)).current;
  const widthAV = useRef(new Animated.Value(0)).current;

  const computedBtnWidths = useMemo(() => {
    if (!containerW || labelW.some((w) => w <= 0)) return null;
    const usable = containerW - wrapHPad * 2;
    const desired = labelW.map((w) => w + pillHPad * 2);
    const sum = desired.reduce((a, b) => a + b, 0);

    const k = Math.max(0.85, Math.min(1.2, usable / sum));
    const widths = desired.map((w) => Math.max(pillMinWidth, Math.round(w * k)));

    let diff = usable - widths.reduce((a, b) => a + b, 0);
    for (let i = 0; i < widths.length && diff !== 0; i++) {
      const step = diff > 0 ? 1 : -1;
      widths[i] += step;
      diff -= step;
    }
    return widths;
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

  return (
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
              onLayout={(e) => {
                const lw = e.nativeEvent.layout.width;
                setLabelW((prev) => (prev[i] === lw ? prev : Object.assign([...prev], { [i]: lw })));
              }}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  btn: {
    height: "100%",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  txt: { color: "#9FB3BF", fontWeight: "800", fontSize: 14 },
  txtActive: { color: "#FFFFFF" },
});