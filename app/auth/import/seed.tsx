// app/onboarding/confirm-seed.tsx (nueva)
import { View, Image, StyleSheet } from 'react-native';

const IMG = require('@assets/wallet-setup/wallet-setup-confirm-seedphrase-1.png');

export default function ConfirmSeed() {
  return (
    <View style={styles.wrap}>
      <Image source={IMG} style={styles.img} resizeMode="contain" />
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#0B0E16', padding: 16, justifyContent: 'center' },
  img: { width: '100%', height: '80%' },
});