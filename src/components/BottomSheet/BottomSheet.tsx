// src/components/BottomSheet/BottomSheet.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
  Keyboard,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 0..1 (default 0.75) */
  maxHeightPct?: number;
  /** Sheet background (no el backdrop) */
  backgroundColor?: string;
  /** 0..1 (default 0.35) */
  backdropOpacity?: number;
  /** Muestra la barrita */
  showHandle?: boolean;
  /** Si true, solo arrastra desde el handle */
  draggableFromHandleOnly?: boolean;
  /** Estilo extra del contenedor interno */
  contentStyle?: StyleProp<ViewStyle>;
  /** Levanta el sheet cuando aparece el teclado (default: true) */
  avoidKeyboard?: boolean;
};

const DEFAULT_BG = "#0E1A21";

export default function BottomSheet({
  visible,
  onClose,
  children,
  maxHeightPct = 0.75,
  backgroundColor = DEFAULT_BG,
  backdropOpacity = 0.35,
  showHandle = true,
  draggableFromHandleOnly = false,
  contentStyle,
  avoidKeyboard = true,
}: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: winH } = useWindowDimensions();

  // px en lugar de "%"
  const pct = Math.max(0.25, Math.min(0.95, maxHeightPct));
  const maxHeightPx = Math.round(winH * pct);

  const translateY = useRef(new Animated.Value(1)).current; // 1 oculto, 0 visible
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fade, { toValue: backdropOpacity, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 1, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [visible, backdropOpacity, fade, translateY]);

  // Drag down para cerrar
  const dragY = useRef(new Animated.Value(0)).current;
  const dragTranslate = Animated.add(
    translateY.interpolate({ inputRange: [0, 1], outputRange: [0, 500] }),
    dragY
  );
  const onMove = (dy: number) => {
    if (dy < 0) return;
    dragY.setValue(dy);
  };
  const closeIfPulled = (value: number) => {
    if (value > 90) onClose();
    Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
  };

  // === teclado ===
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    if (!avoidKeyboard) return;
    const subShow =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillChangeFrame", (e) => {
            const screenH = winH;
            const endY = e.endCoordinates?.screenY ?? screenH;
            const h = Math.max(0, screenH - endY);
            setKbHeight(h);
          })
        : Keyboard.addListener("keyboardDidShow", (e) => setKbHeight(e.endCoordinates?.height ?? 0));
    const subHide =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillHide", () => setKbHeight(0))
        : Keyboard.addListener("keyboardDidHide", () => setKbHeight(0));
    return () => {
      subShow?.remove();
      subHide?.remove();
    };
  }, [avoidKeyboard, winH]);

  const extraBottom = (avoidKeyboard ? kbHeight : 0) + insets.bottom + 12;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === "ios" ? "overFullScreen" : "fullScreen"}
    >
      {/* Backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "black", opacity: fade }]} />
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="Dismiss sheet" />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor,
            paddingBottom: extraBottom,
            transform: [{ translateY: dragTranslate }],
          },
        ]}
      >
        {/* Handle */}
        {showHandle && (
          <Pressable
            onPress={() => {}}
            onTouchMove={(e) =>
              draggableFromHandleOnly ? onMove(e.nativeEvent.touches[0]?.pageY - e.nativeEvent.locationY) : null
            }
            onTouchEnd={(e) =>
              draggableFromHandleOnly ? closeIfPulled(e.nativeEvent.changedTouches[0]?.pageY - e.nativeEvent.locationY) : null
            }
            style={styles.handleWrap}
            accessibilityLabel="Drag handle"
          >
            <View style={styles.handle} />
          </Pressable>
        )}

        {/* Arrastre global (si no limitamos al handle) */}
        {!draggableFromHandleOnly && (
          <View
            onTouchMove={(e) => onMove(e.nativeEvent.touches[0]?.pageY - e.nativeEvent.locationY)}
            onTouchEnd={(e) => closeIfPulled(e.nativeEvent.changedTouches[0]?.pageY - e.nativeEvent.locationY)}
          />
        )}

        <View style={[styles.content, { maxHeight: maxHeightPx }, contentStyle]}>{children}</View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
  },
  handleWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 6 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.28)" },
  content: { paddingHorizontal: 16, paddingTop: 6 },
});