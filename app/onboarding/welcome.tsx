import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ImageBackground, StyleSheet, Dimensions, Animated } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const BG    = require('@assets/onboarding/onboarding-background-0.png');
const LOGO  = require('@assets/logos/HIHODL-white.png');
const SLOGAN = require('@assets/logos/dont-save-hodl.png');

const { height, width } = Dimensions.get('window');

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 380, useNativeDriver: true }).start();
  }, [opacity]);

  return (
    <View style={{ flex: 1 }}>
      {/* Sin backgroundColor para evitar warning en Android edge-to-edge */}
      <StatusBar style="light" translucent />

      {/* Fondo a pantalla completa, sangrando detrás del notch/home-indicator */}
      <ImageBackground
        source={BG}
        resizeMode="cover"
        style={[StyleSheet.absoluteFillObject, { top: -insets.top, bottom: -insets.bottom }]}
      />

      {/* Contenido con fade-in */}
      <Animated.View style={{ flex: 1, opacity }}>
        {/* Centro: logo + slogan */}
        <View style={styles.center}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Image source={SLOGAN} style={styles.slogan} resizeMode="contain" />
        </View>

        {/* CTA al fondo */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
          <TouchableOpacity
            onPress={() => router.push('/onboarding/carousel')}
            style={styles.btn}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            <Text style={styles.btnTxt}>Let’s go</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: Math.min(width * 0.78, 420),
    height: height * 0.18,
    marginBottom: -30,
  },
  slogan: {
    width: Math.min(width * 0.65, 420),
    height: height * 0.06,
    marginBottom: 180,
  },
  bottom: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 0,
  },
  btn: {
    height: 48,
    borderRadius: 80,
    backgroundColor: '#FFB703',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTxt: {
    color: '#0A1A24',
    fontSize: 18,
    fontWeight: '800',
  },
});