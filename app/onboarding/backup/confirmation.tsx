// app/backup/confirmation.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

export default function BackupConfirmation() {
const goNext = () => router.replace('/onboarding/pin-setup');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>¡Backup confirmado!</Text>
        <Text style={styles.subtitle}>
          Your wallet is safe. Go ahead!
        </Text>

        <Pressable style={styles.button} onPress={goNext}>
          <Text style={styles.buttonText}>Keep going</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F1A' },
  content: { paddingHorizontal: 24, alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 288 },
  subtitle: { fontSize: 20, color: '#FFF', textAlign: 'center', marginBottom: 364 },
  button: {
    backgroundColor: '#023047',
    paddingHorizontal: 100,
    paddingVertical: 12,
    borderRadius: 80,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});