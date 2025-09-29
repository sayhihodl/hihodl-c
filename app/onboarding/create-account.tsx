// app/auth/create-account.tsx
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function CreateAccount() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Create your account</Text>
      <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => router.push('../auth/signup')}>
        <Text style={[styles.btnText, { color: '#0A1A24' }]}>Use Email</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.btnDark]} onPress={() => router.push('/onboarding/welcome')}>
        <Text style={styles.btnText}>Start onboarding</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: 24, justifyContent: 'center', gap: 12, backgroundColor: '#0F0F1A' },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  btn: { height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#FFB703' },
  btnDark: { backgroundColor: '#111827' },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});