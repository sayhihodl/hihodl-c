// src/components/SuccessAnimation.tsx
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/theme/colors';

type SuccessAnimationProps = {
  onComplete?: () => void;
  onAnimationEnd?: () => void;
  size?: number;
  color?: string;
};

export function SuccessAnimation({ onComplete, onAnimationEnd, size = 80, color }: SuccessAnimationProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const checkmarkScale = useRef(new Animated.Value(0)).current;
  const checkmarkOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animación de entrada (bounce)
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.2,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      // Delay antes de mostrar el checkmark
      Animated.delay(150),
      // Checkmark aparece
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1,
          friction: 5,
          tension: 30,
          useNativeDriver: true,
        }),
        Animated.timing(checkmarkOpacity, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Llamar callbacks después de la animación
      onAnimationEnd?.();
      if (onComplete) {
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    });

    // Confetti particles animation (simple)
    // Podrías hacer algo más complejo aquí si quieres
  }, []);

  return (
    <View style={styles.container}>
        <Animated.View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: color || colors.cta,
              shadowColor: color || colors.cta,
              transform: [{ scale }],
              opacity,
            },
          ]}
        >
        <Animated.View
          style={{
            transform: [{ scale: checkmarkScale }],
            opacity: checkmarkOpacity,
          }}
        >
          <Ionicons name="checkmark" size={size * 0.6} color={colors.ctaTextOn} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
});

