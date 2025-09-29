// app/onboarding/notifications.tsx
import { View, Text, Image, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HIHODL_DARK = '#023047';
const HIHODL_YELLOW = '#FFB703';

// ✅ Usa el alias correcto (@assets) y asegúrate de que el archivo exista en: src/assets/wallet-setup/wallet-setup-popup.png
const CARD = require('@assets/wallet-setup/wallet-setup-popup.png');


export default function Notifications() {
  const insets = useSafeAreaInsets();
  const goNext = () => router.replace('/onboarding/security');

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}>
      <Pressable onPress={() => router.back()} style={styles.close}>
        <Text style={styles.closeTxt}>×</Text>
      </Pressable>

      <Text style={styles.title}>Stay Updated</Text>
      <Text style={styles.subtitle}>
        Turn on notifications to stay on top of your wallet. Get instant updates when you send, receive, or when prices move big.
      </Text>

      <Image source={CARD} style={styles.card} resizeMode="contain" />

      <View style={styles.footerBtns}>
        <TouchableOpacity onPress={goNext} style={[styles.btn, styles.btnPrimary]}>
          <Text style={[styles.btnText, { color: '#0A1A24' }]}>Turn on Notifications</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={goNext} style={[styles.btn, styles.btnSecondary]}>
          <Text style={[styles.btnText, { color: '#1F2937' }]}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: HIHODL_DARK, paddingHorizontal: 24 },
  close: { position: 'absolute', right: 18, top: 12, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: '#CFE3EC', fontSize: 24, lineHeight: 24, fontWeight: '700' },
  title: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 64 },
  subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 16, marginTop: 32 },
  card: { width: '100%', height: 220, marginTop: 24, borderRadius: 20 },
  footerBtns: { position: 'absolute', left: 24, right: 24, bottom: 24, gap: 12 },
  btn: { height: 48, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: HIHODL_YELLOW },
  btnSecondary: { backgroundColor: '#D1D5DB' },
  btnText: { fontSize: 18, fontWeight: '800' },
});