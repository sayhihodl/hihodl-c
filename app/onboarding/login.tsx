// app/onboarding/login.tsx
import {
  SafeAreaView,
  View,
  ImageBackground,
  Image,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import LogoIcon from '@assets/logos/logo-icon.svg';

// Background correcto (archivo en assets/onboarding/onboarding-background-0.png)
const BG   = require('@assets/onboarding/onboarding-background-0.png');

// Iconos (opcionales)
let G_ICON: any, A_ICON: any;
try { G_ICON = require('@assets/icons/google.png'); } catch {}
try { A_ICON = require('@assets/icons/apple.png'); } catch {}

export default function Login() {
  const goEmail = () => router.push('../auth/email');      // usa absoluto
  const goBack  = () => router.replace('/onboarding/entry');

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <ImageBackground source={BG} resizeMode="cover" style={{ flex: 1 }} />
      </View>

      <View style={styles.container}>
        <View style={styles.logo}>
          <LogoIcon width={120} height={48} />
        </View>

        <Pressable style={[styles.cta, styles.ctaLight]} onPress={() => { /* TODO: Google Auth */ }}>
          <View style={styles.row}>
            {G_ICON ? <Image source={G_ICON} style={styles.icon} /> : null}
            <Text style={[styles.ctaText, styles.ctaTextDark]}>Continue with Google</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.cta, styles.ctaDark]} onPress={() => { /* TODO: Apple Auth */ }}>
          <View style={styles.row}>
            {A_ICON ? <Image source={A_ICON} style={styles.icon} /> : null}
            <Text style={[styles.ctaText, styles.ctaTextLight]}>Continue with Apple</Text>
          </View>
        </Pressable>

        <Pressable style={[styles.cta, styles.ctaPrimary]} onPress={goEmail}>
          <Text style={[styles.ctaText, styles.ctaTextDark]}>Continue with email</Text>
        </Pressable>

        <Pressable onPress={goBack} style={{ alignSelf: 'center', marginTop: 10 }}>
          <Text style={{ color: '#CFE3EC' }}>Back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', padding: 24, gap: 12 },
  logo: { position: 'absolute', top: 24, left: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center' },
  icon: { width: 20, height: 20 },
  cta: { height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  ctaLight: { backgroundColor: '#FFFFFF' },
  ctaDark: { backgroundColor: '#0F0F1A' },
  ctaPrimary: { backgroundColor: '#FFB703' },
  ctaText: { fontWeight: '800', fontSize: 16 },
  ctaTextLight: { color: '#FFFFFF' },
  ctaTextDark: { color: '#0A1A24' },
});