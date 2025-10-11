// src/components/BottomSheet/BottomKeyboardModal.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  Modal, View, Pressable, StyleSheet, Animated, Easing, Platform,
  Keyboard, PanResponder, useWindowDimensions, TouchableWithoutFeedback,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Tone = "calm" | "teal" | "ink";

type Props = {
  visible: boolean;
  onClose: () => void;
  scrimOpacity?: number;
  blurIntensity?: number;
  glassTintRGBA?: string;     // sigue funcionando si lo pasas
  tone?: Tone;                // 👈 preset de color (si pasas glassTintRGBA, tiene prioridad)
  dragAnywhere?: boolean;
  dragCloseThreshold?: number;
  tapToDismissKeyboard?: boolean;
  minHeightPct?: number;
  maxHeightPct?: number;
  autoFocusRef?: React.RefObject<any>;
  showHandle?: boolean;
  /** 🔑 Gate: true = permite drag-to-close; false = bloqueado */
  dragGateRef?: React.MutableRefObject<boolean | undefined>;
  /** 🧲 cuando es true el teclado NO empuja el sheet (queda fijo). */
  ignoreKeyboard?: boolean;
  /** 👇 permite desactivar cierre al tocar el scrim */
  dismissOnScrimPress?: boolean;
  children: React.ReactNode;
};

const TONE: Record<Tone, string> = {
  calm: "rgba(6,14,20,0.38)",
  teal: "rgba(9,24,34,0.55)",
  ink:  "rgba(8,12,18,0.60)",
};

export default function BottomKeyboardModal({
  visible,
  onClose,
  scrimOpacity = 0.5,
  blurIntensity = 60,
  glassTintRGBA,
  tone = "teal",
  dragAnywhere = true,
  dragCloseThreshold = 100,
  tapToDismissKeyboard = true,
  minHeightPct = 0.82,
  maxHeightPct = 0.9,
  autoFocusRef,
  showHandle = false,
  dragGateRef,
  ignoreKeyboard = false,
  dismissOnScrimPress = true,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const [kbH, setKbH] = useState(0);
  const pendingFocus = useRef(false);

  // ===== Keyboard listeners =====
  useEffect(() => {
    if (ignoreKeyboard) { setKbH(0); return; }

    const onFrameIOS = (e: any) => {
      const endY = e?.endCoordinates?.screenY ?? screenH;
      const h = Math.max(0, screenH - endY);
      setKbH(h);
      if (pendingFocus.current && h > 0) {
        pendingFocus.current = false;
        requestAnimationFrame(() => autoFocusRef?.current?.focus?.());
      }
    };

    const showSub =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillChangeFrame", onFrameIOS)
        : Keyboard.addListener("keyboardDidShow", (e) => setKbH(e.endCoordinates?.height ?? 0));

    const hideSub =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillHide", () => setKbH(0))
        : Keyboard.addListener("keyboardDidHide", () => setKbH(0));

    return () => { showSub.remove(); hideSub.remove(); };
  }, [screenH, autoFocusRef, ignoreKeyboard]);

  // ===== Aparecer / desaparecer =====
  useEffect(() => {
    if (visible) {
      translateY.setValue(40);
      Animated.parallel([
        Animated.timing(fade,       { toValue: 1, duration: 160, easing: Easing.out(Easing.quad),  useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(fade, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true })
        .start(() => translateY.setValue(0));
    }
  }, [visible, translateY, fade]);

  const handleOnShow = () => {
    if (!autoFocusRef?.current) return;
    if (ignoreKeyboard) requestAnimationFrame(() => autoFocusRef.current?.focus?.());
    else pendingFocus.current = true;
  };

  // ===== Drag-to-close con gate =====
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_evt, g) => {
        const gateOK = dragGateRef?.current !== false;
        return dragAnywhere && gateOK && g.dy > 6 && g.dy > Math.abs(g.dx);
      },
      onMoveShouldSetPanResponderCapture: (_evt, g) => {
        const gateOK = dragGateRef?.current !== false;
        return dragAnywhere && gateOK && g.dy > 6 && g.dy > Math.abs(g.dx);
      },
      onPanResponderGrant: () => { autoFocusRef?.current?.blur?.(); Keyboard.dismiss(); },
      onPanResponderMove: (_evt, g) => { translateY.setValue(Math.max(0, g.dy)); },
      onPanResponderRelease: (_evt, g) => {
        const shouldClose = g.dy > dragCloseThreshold || g.vy > 1;
        if (shouldClose) {
          Animated.timing(translateY, { toValue: 300, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true })
            .start(onClose);
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
      },
    })
  ).current;

  if (!visible) return null;

  const minH = Math.max(0.2, Math.min(0.98, minHeightPct)) * screenH;
  const maxH = Math.max(minH, Math.max(0.2, Math.min(0.98, maxHeightPct)) * screenH);

  const scrimAnimatedOpacity = fade.interpolate({ inputRange: [0, 1], outputRange: [0, scrimOpacity] });
  const bottomOffset = ignoreKeyboard ? 0 : kbH;

  const tint = glassTintRGBA ?? TONE[tone];

  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={onClose}
      onShow={handleOnShow}
      presentationStyle={Platform.OS === "ios" ? "overFullScreen" : "fullScreen"}
      supportedOrientations={["portrait"]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "black", opacity: scrimAnimatedOpacity }]} />
      {dismissOnScrimPress ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); onClose(); }} />
      ) : (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} />
      )}

      <Animated.View
        style={[styles.shell, { bottom: bottomOffset, transform: [{ translateY }] }]}
        {...(dragAnywhere ? pan.panHandlers : {})}
      >
        <View style={[styles.sheet, { minHeight: minH, maxHeight: maxH, paddingBottom: insets.bottom }]}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} pointerEvents="none">
            <BlurView tint="dark" intensity={blurIntensity} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
          </Animated.View>

          {showHandle && (
            <View style={styles.handleWrap} {...(!dragAnywhere ? pan.panHandlers : {})}>
              <View style={styles.handle} />
            </View>
          )}

          {tapToDismissKeyboard ? (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.content}>{children}</View>
            </TouchableWithoutFeedback>
          ) : (
            <View style={styles.content}>{children}</View>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: { position: "absolute", left: 0, right: 0, justifyContent: "flex-end" },
  sheet: { overflow: "hidden", borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  handleWrap: { alignItems: "center", paddingTop: 8, paddingBottom: 6 },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.28)" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
});