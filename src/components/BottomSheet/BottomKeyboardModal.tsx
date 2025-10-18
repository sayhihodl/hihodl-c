import React, { useEffect, useRef, useState } from "react";
import {
  Modal, View, Pressable, StyleSheet, Animated, Easing, Platform,
  Keyboard, PanResponder, useWindowDimensions, TouchableWithoutFeedback,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import GlassHeader from "@/ui/GlassHeader";

type Tone = "calm" | "teal" | "ink";

type Props = {
  visible: boolean;
  onClose: () => void;
  scrimOpacity?: number;
  blurIntensity?: number;
  sheetTintRGBA?: string;
  tone?: Tone;
  dragAnywhere?: boolean;            // si true, siempre permite arrastrar; si false, sólo handle
  dragCloseThreshold?: number;
  tapToDismissKeyboard?: boolean;
  minHeightPct?: number;
  maxHeightPct?: number;
  autoFocusRef?: React.RefObject<any>;
  dismissOnScrimPress?: boolean;
  children: React.ReactNode;
  blurTopOnly?: boolean;
  blurTopHeight?: number;
  headerBgDefaultHeight?: number;
  header?: {
    left?: React.ReactNode;
    center?: React.ReactNode;
    right?: React.ReactNode;
    height?: number;
    innerTopPad?: number;
    sideWidth?: number;
    centerWidthPct?: number;
    overlayColor?: string;
    blurTint?: "dark" | "light" | "default";
    showHandleTop?: boolean;
    centerHeaderContent?: boolean;
  };
  /** 👉 Gate externo: true cuando la lista está ARRIBA del todo */
  dragGateRef?: React.MutableRefObject<boolean | undefined>;
  ignoreKeyboard?: boolean;
};

const TONE: Record<Tone, string> = {
  calm: "rgba(6,14,20,0.38)",
  teal: "rgba(9,24,34,0.55)",
  ink:  "rgba(8,12,18,0.60)",
};

export default function BottomKeyboardModal({
  visible,
  onClose,
  scrimOpacity = 0.6,
  blurIntensity = 50,
  sheetTintRGBA,
  tone = "teal",
  dragAnywhere = false,
  dragCloseThreshold = 100,
  tapToDismissKeyboard = true,
  minHeightPct = 0.82,
  maxHeightPct = 0.9,
  autoFocusRef,
  dismissOnScrimPress = true,
  children,
  blurTopOnly = true,
  blurTopHeight = 86,
  headerBgDefaultHeight = 86,
  header,
  dragGateRef,
  ignoreKeyboard = true,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  const headerScroll = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const [kbH, setKbH] = useState(0);

  // ===== keyboard =====
  useEffect(() => {
    if (ignoreKeyboard) { setKbH(0); return; }
    const subShow =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillChangeFrame", (e) => {
            const endY = e?.endCoordinates?.screenY ?? screenH;
            setKbH(Math.max(0, screenH - endY));
          })
        : Keyboard.addListener("keyboardDidShow", (e) => setKbH(e.endCoordinates?.height ?? 0));
    const subHide =
      Platform.OS === "ios"
        ? Keyboard.addListener("keyboardWillHide", () => setKbH(0))
        : Keyboard.addListener("keyboardDidHide", () => setKbH(0));
    return () => { subShow.remove(); subHide.remove(); };
  }, [screenH, ignoreKeyboard]);

  // ===== appear / disappear =====
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

  // ===== helpers =====
  const gateOK = () => (dragGateRef ? dragGateRef.current === true : true);

  // ===== pan: captura vertical cuando la lista está en top =====
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: (_evt, g) => {
      // Solo captura si se mueve verticalmente (no en tap corto)
      return dragAnywhere && Math.abs(g.dy) > 4;
    },
      // ⬇️ Capturamos el gesto SOLO cuando: gate OK, gesto vertical y moviendo >6px
      onMoveShouldSetPanResponderCapture: (_evt, g) => {
        const vertical = Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx);
        if (!vertical) return false;

        // Si dragAnywhere => siempre; si no, sólo cuando gate OK (lista arriba) y arrastre hacia abajo
        if (dragAnywhere) return true;
        return gateOK() && g.dy > 0;
      },
      onMoveShouldSetPanResponder: () => false,
      onPanResponderGrant: () => Keyboard.dismiss(),

      onPanResponderMove: (_evt, g) => {
        // No permitimos mover hacia arriba (negativo) para no pelear con el scroll
        const dy = Math.max(0, g.dy);
        translateY.setValue(dy);
      },
      onPanResponderTerminationRequest: () => false,
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
  const tint = sheetTintRGBA ?? "rgba(7,16,22,0.82)";

  const headerHeight = header?.height ?? headerBgDefaultHeight;
  const headerTopPad = header?.innerTopPad ?? 6;
  const HEADER_TOTAL = header ? insets.top + headerTopPad + headerHeight : 0;

  return (
    <Modal
      transparent
      visible
      animationType="none"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === "ios" ? "overFullScreen" : "fullScreen"}
      supportedOrientations={["portrait"]}
    >
      {/* scrim */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "black", opacity: scrimAnimatedOpacity }]} />
      {dismissOnScrimPress ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); onClose(); }} />
      ) : (
        <View pointerEvents="none" style={StyleSheet.absoluteFill} />
      )}

      {/* sheet */}
      <Animated.View
        style={[styles.shell, { bottom: bottomOffset, transform: [{ translateY }] }]}
        {...pan.panHandlers}  // ⬅️ siempre adjunto; la captura decide si roba el gesto
      >
        <View style={[styles.sheet, { minHeight: minH, maxHeight: maxH, paddingBottom: insets.bottom }]}>
         {/* === FONDO: modo Glass === */}
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} pointerEvents="none">
            {blurTopOnly ? (
              // Base translúcida y blur SOLO en la franja superior
              <>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
                {(blurTopHeight ?? 0) > 0 && (
                  <View style={[styles.topBlurClip, { height: blurTopHeight }]}> 
                    <BlurView tint="dark" intensity={blurIntensity} style={StyleSheet.absoluteFill} />
                  </View>
                )}
              </>
            ) : (
              // Blur en TODO el sheet + overlay translúcido por encima
              <>
                <BlurView tint="dark" intensity={blurIntensity} style={StyleSheet.absoluteFill} />
                <View style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} />
              </>
            )}
          </Animated.View>

          {/* header */}
          {header && (
            <GlassHeader
              scrolly={headerScroll}
              blurTint={header.blurTint ?? "dark"}
              overlayColor="transparent"
              height={headerHeight}
              innerTopPad={headerTopPad}
              sideWidth={header.sideWidth ?? 45}
              centerWidthPct={header.centerWidthPct ?? 92}
              leftSlot={header.left}
              rightSlot={header.right}
              contentStyle={{ paddingHorizontal: 12, justifyContent: header?.centerHeaderContent ? "center" : "flex-start" }}
              centerSlot={
                <View style={{ width: "100%", alignItems: "center" }}>
                  {header.showHandleTop && (
                    <View style={styles.handleWrap}>
                      <View style={styles.handle} />
                    </View>
                  )}
                  <View style={{ width: "100%", alignItems: "center" }}>
                    {header.center}
                  </View>
                </View>
              }
            />
          )}

          {/* contenido */}
          <View style={{ paddingTop: HEADER_TOTAL, flex: 1 }}>
            {tapToDismissKeyboard ? (
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={styles.content}>{children}</View>
              </TouchableWithoutFeedback>
            ) : (
              <View style={styles.content}>{children}</View>
            )}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  shell: { position: "absolute", top: 0, left: 0, right: 0, justifyContent: "flex-end" },
  sheet: { overflow: "hidden", borderTopLeftRadius: 22, borderTopRightRadius: 22 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  topBlurClip: {
    position: "absolute",
    top: 0, left: 0, right: 0,
    overflow: "hidden",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 8 },
  handle:    { width: 44, height: 4, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.30)" },
});