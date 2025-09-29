import React, { useEffect, useRef } from "react";
import { View, Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";

const ACTIVE = "#FFB703";

export default function HiHodlSpinner({ size = 36 }: { size?: number }) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rot, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [rot]);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const r = size / 2;
  const orbit = r - 3;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={r} cy={r} r={orbit} stroke={ACTIVE} strokeOpacity={0.35} strokeWidth={2} fill="none" />
      </Svg>
      <Animated.View
        style={{
          position: "absolute",
          width: 6, height: 6, borderRadius: 3, backgroundColor: ACTIVE,
          transform: [{ rotate }, { translateY: -orbit }],
        }}
      />
    </View>
  );
}