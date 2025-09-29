// src/components/FullScreenMenu.tsx
import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

export type FullScreenMenuRef = {
  open: () => void;
  close: () => void;
};

type Props = { children: React.ReactNode };

const { width: W } = Dimensions.get("window");
const DURATION = 220;

const FullScreenMenu = forwardRef<FullScreenMenuRef, Props>(
  ({ children }, ref) => {
    // visible para montar/desmontar el overlay
    const [visible, setVisible] = useState(false);
    // tx: panel entra desde la derecha → width -> 0
    const tx = useRef(new Animated.Value(W)).current;

    const open = useCallback(() => {
      setVisible(true);
      Animated.timing(tx, {
        toValue: 0,
        duration: DURATION,
        useNativeDriver: true,
      }).start();
    }, [tx]);

    const close = useCallback(() => {
      Animated.timing(tx, {
        toValue: W,
        duration: DURATION,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, [tx]);

    useImperativeHandle(ref, () => ({ open, close }), [open, close]);

    // Permite cerrar arrastrando el panel hacia la derecha
    const panToClose = Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-10, 10])
      .onEnd((e) => {
        if (e.translationX > 28) close();
      });

    if (!visible) return null;

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Tocar fuera cierra */}
        <Pressable style={styles.scrim} onPress={close} />

        {/* Panel a pantalla completa */}
        <GestureDetector gesture={panToClose}>
          <Animated.View
            style={[
              styles.panel,
              {
                transform: [{ translateX: tx }],
              },
            ]}
          >
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    );
  }
);

FullScreenMenu.displayName = "FullScreenMenu";

export default FullScreenMenu;

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  panel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0, // ocupa toda la pantalla
    backgroundColor: "#0B1720",
    paddingHorizontal: 16,
    paddingTop: 20,
  },
});