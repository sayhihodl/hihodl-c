// app/onboarding/entry.tsx
import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const BG = require('@assets/onboarding/onboarding-background-0.png');

// Paleta HiHODL
const HIHODL_YELLOW = '#FFB703';
const HIHODL_DARK   = '#023047';
const LINK_MUTED    = '#8ECAE6';

// --- Iconos opcionales (no rompen si no existen) ---
let EMAIL_ICON: any, GOOGLE_ICON: any, APPLE_ICON: any;
try { EMAIL_ICON  = require('@assets/icons/email.png');  } catch {}
try { GOOGLE_ICON = require('@assets/icons/google.png'); } catch {}
try { APPLE_ICON  = require('@assets/icons/apple.png');  } catch {}

// Alturas para animaciones
const SCREEN_H = Dimensions.get('window').height;

export default function Entry() {
  const insets = useSafeAreaInsets();

  // ---- acciones principales ----
  const openSheet = (which: 'signup' | 'signin') => {
    setMode(which);
    setOpen(true);
    fade.setValue(0);
    translateY.setValue(SCREEN_H);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  };
  const goCreate = () => openSheet('signup');
  const goLogin  = () => openSheet('signin');
  const goImport = () => router.push('/auth/import');

  // ---- estado bottom sheet ----
  const [mode, setMode]   = useState<null | 'signup' | 'signin'>(null);
  const [isOpen, setOpen] = useState(false);

  // animaciones sheet
  const fade = useRef(new Animated.Value(0)).current;               // backdrop
  const translateY = useRef(new Animated.Value(SCREEN_H)).current;  // hoja

  // drag to close
  const dragY = useRef(0);
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderGrant: () => {
        dragY.current = 0;
      },
      onPanResponderMove: (_, g) => {
        const dy = Math.max(0, g.dy);
        dragY.current = dy;
        translateY.setValue(dy);
      },
      onPanResponderRelease: (_, g) => {
        const shouldClose = g.vy > 0.8 || dragY.current > 120;
        if (shouldClose) closeSheet();
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
      },
    })
  ).current;

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 160, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: SCREEN_H, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => {
      setOpen(false);
      setMode(null);
      translateY.setValue(SCREEN_H);
    });
  };

  // asegúrate de que no aparezca “abierto” al montar
  useEffect(() => {
    setOpen(false);
    setMode(null);
    fade.setValue(0);
    translateY.setValue(SCREEN_H);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sheetTitle = useMemo(() => (mode === 'signin' ? 'Sign in' : 'Create an account'), [mode]);

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
        {/* Título */}
        <View style={styles.headerWrap}>
          <Text style={styles.title} numberOfLines={3}>
            How do you want to{'\n'}start?
          </Text>
        </View>

        {/* Controles inferiores */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable style={[styles.btn, styles.btnPrimary]} onPress={goCreate}>
            <Text style={[styles.btnTxt, styles.btnTxtDark]}>Create an account</Text>
          </Pressable>

          <Pressable style={[styles.btn, styles.btnSecondary]} onPress={goLogin}>
            <Text style={[styles.btnTxt, styles.btnTxtLight]}>I have already an account</Text>
          </Pressable>

          <Pressable onPress={goImport} hitSlop={12} style={styles.importWrap}>
            <Text style={styles.importTxt}>Import wallet</Text>
          </Pressable>

          <View style={styles.termsWrap}>
            <Text style={styles.termsTxt}>
              By creating an account,{'\n'}you accept <Text style={styles.termsLink}>terms and conditions</Text>
            </Text>
          </View>
        </View>
      </ImageBackground>

      {/* Backdrop */}
      {isOpen && (
        <Animated.View
          pointerEvents={isOpen ? 'auto' : 'none'}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: '#000',
              opacity: fade.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] }),
            },
          ]}
        >
          <Pressable style={{ flex: 1 }} onPress={closeSheet} />
        </Animated.View>
      )}

      {/* Bottom Sheet con arrastre */}
      {isOpen && (
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16, transform: [{ translateY }] },
          ]}
          {...pan.panHandlers}
        >
          {/* handle/drag bar */}
          <View style={styles.handle} />

          <Text style={styles.sheetTitle}>{sheetTitle}</Text>

          {/* Acciones con iconos */}
          <View style={styles.sheetList}>
            <ActionRow
              icon={EMAIL_ICON}
              label={mode === 'signin' ? 'Sign in with Email' : 'Sign up with Email'}
              onPress={() => router.push(`/onboarding/email?mode=${mode ?? 'signup'}`)}
            />
            <ActionRow
              icon={GOOGLE_ICON}
              label={mode === 'signin' ? 'Sign in with Google' : 'Sign up with Google'}
              onPress={() => {/* hook de Google (mock en Expo Go) */}}
            />
            <ActionRow
              icon={APPLE_ICON}
              label={mode === 'signin' ? 'Sign in with Apple' : 'Sign up with Apple'}
              onPress={() => {/* hook de Apple (mock en Expo Go) */}}
            />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

/** Fila con icono + texto (tolerante a icono faltante) */
function ActionRow({
  icon,
  label,
  onPress,
}: {
  icon?: any;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      {icon ? (
        <Image source={icon} style={styles.rowIcon} resizeMode="contain" />
      ) : (
        <View style={[styles.rowIcon, styles.rowIconFallback]} />
      )}
      <Text style={styles.rowLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  headerWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  title: {
    color: '#fff',
    fontSize: 25,
    lineHeight: 40,
    fontWeight: '800',
    textAlign: 'center',
    paddingBottom: 250, // para respetar la composición de tu referencia
  },

  bottom: { paddingHorizontal: 20, gap: 16 },

  btn: {
    height: 48,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  btnPrimary: { backgroundColor: HIHODL_YELLOW },
  btnSecondary: { backgroundColor: HIHODL_DARK },
  btnTxt: { fontSize: 20, fontWeight: '800' },
  btnTxtLight: { color: '#FFFFFF' },
  btnTxtDark: { color: '#0B0B0B' },

  importWrap: { alignSelf: 'center', paddingVertical: 10 },
  importTxt: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  termsWrap: { marginTop: 8, alignItems: 'center' },
  termsTxt: { color: '#FFFFFF', opacity: 0.9, textAlign: 'center', fontSize: 14, lineHeight: 18 },
  termsLink: { color: LINK_MUTED, textDecorationLine: 'underline', fontWeight: '700' },

  // --- Bottom sheet ---
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    backgroundColor: HIHODL_DARK,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginBottom: 8,
  },
  sheetTitle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 24,
    marginBottom: 12,
  },
  sheetList: { marginTop: 4 },

  row: {
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  rowIcon: { width: 26, height: 26, marginRight: 12 },
  rowIconFallback: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 6 },
  rowLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
});