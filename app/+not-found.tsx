import { Stack, router } from 'expo-router';
import { StyleSheet, Image, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '../src/components/ThemedText';
import { ThemedView } from '../src/components/ThemedView';

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <Image
          source={require('../assets/logos/HIHODL-white.png')}
          style={{ width: 200, height: 80, marginBottom: 20, resizeMode: 'contain' }}
        />
        <ThemedText type="title">Lost in the blockchain?</ThemedText>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
          <ThemedText style={styles.btnText}>Back to Home</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  btn: {
    marginTop: 15,
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: '700' },
});