/**
 * Animation utilities for smooth transitions
 */
import { Animated, Easing } from 'react-native';

export const AnimationConfigs = {
  fade: {
    duration: 200,
    easing: Easing.out(Easing.cubic),
  },
  slide: {
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  scale: {
    duration: 250,
    easing: Easing.out(Easing.back(1.5)),
  },
  spring: {
    tension: 100,
    friction: 8,
  },
} as const;

/**
 * Create fade animation
 */
export function createFadeAnimation(initialValue = 0) {
  const opacity = new Animated.Value(initialValue);

  const fadeIn = (duration = AnimationConfigs.fade.duration) => {
    return Animated.timing(opacity, {
      toValue: 1,
      duration,
      easing: AnimationConfigs.fade.easing,
      useNativeDriver: true,
    });
  };

  const fadeOut = (duration = AnimationConfigs.fade.duration) => {
    return Animated.timing(opacity, {
      toValue: 0,
      duration,
      easing: AnimationConfigs.fade.easing,
      useNativeDriver: true,
    });
  };

  return { opacity, fadeIn, fadeOut };
}

/**
 * Create slide animation
 */
export function createSlideAnimation(initialValue = -100) {
  const translateY = new Animated.Value(initialValue);

  const slideIn = (duration = AnimationConfigs.slide.duration) => {
    return Animated.timing(translateY, {
      toValue: 0,
      duration,
      easing: AnimationConfigs.slide.easing,
      useNativeDriver: true,
    });
  };

  const slideOut = (duration = AnimationConfigs.slide.duration) => {
    return Animated.timing(translateY, {
      toValue: initialValue,
      duration,
      easing: AnimationConfigs.slide.easing,
      useNativeDriver: true,
    });
  };

  return { translateY, slideIn, slideOut };
}

/**
 * Create scale animation
 */
export function createScaleAnimation(initialValue = 0.8) {
  const scale = new Animated.Value(initialValue);

  const scaleIn = (duration = AnimationConfigs.scale.duration) => {
    return Animated.timing(scale, {
      toValue: 1,
      duration,
      easing: AnimationConfigs.scale.easing,
      useNativeDriver: true,
    });
  };

  const scaleOut = (duration = AnimationConfigs.scale.duration) => {
    return Animated.timing(scale, {
      toValue: initialValue,
      duration,
      easing: AnimationConfigs.scale.easing,
      useNativeDriver: true,
    });
  };

  return { scale, scaleIn, scaleOut };
}

/**
 * Create combined animation (fade + scale)
 */
export function createCombinedAnimation() {
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.9);

  const animateIn = (duration = 250) => {
    return Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: AnimationConfigs.scale.easing,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration,
        easing: AnimationConfigs.scale.easing,
        useNativeDriver: true,
      }),
    ]);
  };

  const animateOut = (duration = 200) => {
    return Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration,
        easing: AnimationConfigs.fade.easing,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration,
        easing: AnimationConfigs.fade.easing,
        useNativeDriver: true,
      }),
    ]);
  };

  return { opacity, scale, animateIn, animateOut };
}






