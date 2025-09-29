// app/auth/choose.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ImageBackground,
  View,
  Pressable,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
  BackHandler,
  Platform,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithGoogle } from '@/lib/google-auth'; // ✅ sin /src

// ✅ para assets usa require relativo (no alias @)
const BG     = require('../../assets/onboarding/onboarding-background-0.png');
const G_ICON = require('../../assets/icons/google.png');
const A_ICON = require('../../assets/icons/apple.png');

const { height: SCREEN_H } = Dimensions.get('window');

export default function Choose() {
  const insets = useSafeAreaInsets();
  const PEEK_TOP = Math.max(insets.top + 90, SCREEN_H * 0.18);

  const [mode, setMode] = useState<'signup' | 'signin' | null>(null);
  const title = mode === 'signup' ? 'Create an account' : mode === 'signin' ? 'Sign in' : '';

  const fade   = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(24)).current;

  const openSheet = useCallback((m: 'signup' | 'signin') => {
    setMode(m);
    fade.setValue(0);
    slideY.setValue(24);
    Animated.parallel([
      Animated.timing(fade,   { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, slideY]);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(fade,   { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slideY, { toValue: 24, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(({ finished }) => finished && setMode(null));
  }, [fade, slideY]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mode) { closeSheet(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [mode, closeSheet]);

  const goEmail = () => router.push(`/onboarding/email?mode=${mode === 'signup' ? 'signup' : 'signin'}`);

  return (
    <ImageBackground source={BG} style={{ flex: 1 }} resizeMode="cover">
      <View style={[s.panel, { paddingBottom: insets.bottom + 32 }]} pointerEvents={mode ? 'none' : 'auto'}>
        <Text style={s.title}>How do you want to start?</Text>

        <Pressable style={[s.btn, s.btnPrimary]} onPress={() => openSheet('signup')}>
          <Text style={[s.btnText, { color: '#0A1A24' }]}>Create an account</Text>
        </Pressable>

        <Pressable style={[s.btn, s.btnDark]} onPress={() => openSheet('signin')}>
          <Text style={[s.btnText, { color: '#fff' }]}>I already have an account</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Import wallet"
          hitSlop={10}
          onPress={() => {
            if (mode) { closeSheet(); setTimeout(() => router.push('/auth/import'), 180); }
            else { router.push('/auth/import'); }
          }}
          style={{ alignSelf: 'center', marginTop: 8 }}
        >
          <Text style={{ color: '#CFE3EC' }}>Import wallet</Text>
        </Pressable>

        <Text style={s.tc}>By creating an account, you accept terms and conditions</Text>
      </View>

      {mode && (
        <>
          <Pressable style={[StyleSheet.absoluteFillObject, { zIndex: 10 }]} onPress={closeSheet} />
          <Animated.View
            style={[
              s.sheet,
              {
                top: PEEK_TOP,
                paddingBottom: insets.bottom + 16,
                opacity: fade,
                transform: [{ translateY: slideY }],
                zIndex: 20,
                elevation: 20,
              },
            ]}
          >
            <View style={s.handleWrap}><View style={s.handle} /></View>
            <Text style={s.sheetTitle}>{title}</Text>

            <Pressable
              style={[s.cta, s.ctaLight]}
              onPress={() => { signInWithGoogle(); }}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(0,0,0,0.08)', radius: 220 } : undefined}
            >
              <View style={s.row}>
                <Image source={G_ICON} style={s.icon} />
                <Text style={[s.ctaText, s.ctaTextDark]}>
                  {mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[s.cta, s.ctaDark]}
              onPress={() => { /* TODO: Apple */ }}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(255,255,255,0.08)', radius: 220 } : undefined}
            >
              <View style={s.row}>
                <Image source={A_ICON} style={s.icon} />
                <Text style={[s.ctaText, s.ctaTextLight]}>
                  {mode === 'signup' ? 'Sign up with Apple' : 'Sign in with Apple'}
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[s.cta, s.ctaPrimary]}
              onPress={goEmail}
              android_ripple={Platform.OS === 'android' ? { color: 'rgba(0,0,0,0.08)', radius: 220 } : undefined}
            >
              <Text style={[s.ctaText, s.ctaTextDark]}>
                {mode === 'signup' ? 'Sign up with email' : 'Sign in with email'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => { closeSheet(); setTimeout(() => router.push('/auth/import'), 160); }}
              style={s.linkWrap}
            >
              <Text style={s.link}>Import wallet</Text>
            </Pressable>
          </Animated.View>
        </>
      )}
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  panel: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { color: '#fff', fontSize: 20, textAlign: 'center', marginBottom: 12 },
  btn: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#FFB703' },
  btnDark: { backgroundColor: '#023047' },
  btnText: { fontWeight: '800', fontSize: 16 },
  tc: { color: '#9CA3AF', fontSize: 12, textAlign: 'center', marginTop: 12 },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20, paddingTop: 10, gap: 10,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    backgroundColor: 'rgba(15,15,26,0.96)',
  },
  handleWrap: { alignItems: 'center', paddingVertical: 6 },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  sheetTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  icon: { width: 18, height: 18 },
  cta: { height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  ctaLight: { backgroundColor: '#FFFFFF' },
  ctaDark: { backgroundColor: '#0F0F1A', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  ctaPrimary: { backgroundColor: '#FFB703' },
  ctaText: { fontWeight: '800', fontSize: 15 },
  ctaTextLight: { color: '#FFFFFF' },
  ctaTextDark: { color: '#0A1A24' },
  linkWrap: { alignSelf: 'center', marginTop: 6 },
  link: { color: '#CFE3EC', fontSize: 13, fontWeight: '600' },
});