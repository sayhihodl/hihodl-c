// src/components/hotspot.tsx
import { Pressable, View, StyleSheet } from 'react-native';

type Props = {
  // percent-based relative layout on parent (ImageBackground)
  leftPct: number; // 0..100
  topPct: number;  // 0..100
  widthPct: number;
  heightPct: number;
  onPress: () => void;
  debug?: boolean; // set true to ver el rectángulo
};

export default function Hotspot({ leftPct, topPct, widthPct, heightPct, onPress, debug }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.hit,
        {
          left: `${leftPct}%`,
          top: `${topPct}%`,
          width: `${widthPct}%`,
          height: `${heightPct}%`,
          backgroundColor: debug ? 'rgba(255,0,0,0.2)' : 'transparent',
        },
      ]}
      accessibilityRole="button"
    >
      {/* opcional: un View para aumentar área táctil o depurar */}
      <View style={{ flex: 1 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: {
    position: 'absolute',
    zIndex: 10,
  },
});