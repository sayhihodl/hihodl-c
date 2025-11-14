// src/components/FluidGlassTabBarLite.tsx
// Versión ligera usando expo-blur y reanimated (RECOMENDADO)
// Efecto similar sin el overhead de Three.js

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface FluidGlassTabBarLiteProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark';
}

export default function FluidGlassTabBarLite({
  children,
  intensity = 80,
  tint = 'dark',
}: FluidGlassTabBarLiteProps) {
  // Animación sutil de "fluido"
  const animation = useSharedValue(0);

  React.useEffect(() => {
    animation.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(animation.value, [0, 1], [-2, 2]);
    const opacity = interpolate(animation.value, [0, 0.5, 1], [0.3, 0.5, 0.3]);
    
    return {
      transform: [{ translateX }],
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      {/* Blur de fondo */}
      <BlurView
        intensity={intensity}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      
      {/* Gradiente animado para efecto "fluido" */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <LinearGradient
          colors={[
            'rgba(255, 183, 3, 0.1)',
            'rgba(33, 158, 188, 0.1)',
            'rgba(255, 183, 3, 0.1)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Overlay de vidrio */}
      <View style={styles.glassOverlay} />

      {/* Contenido */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
});



