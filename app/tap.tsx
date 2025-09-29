// app/tap.tsx
import { View, Pressable, Text, Alert } from 'react-native';

export default function TapTest() {
  return (
    <View style={{ flex: 1, alignItems:'center', justifyContent:'center', backgroundColor: '#101826' }}>
      <Pressable
        onPress={() => Alert.alert('OK', 'Tap recibido')}
        style={{ padding: 20, backgroundColor: '#FFB703', borderRadius: 12 }}
      >
        <Text style={{ fontWeight: '800' }}>Tap aquí</Text>
      </Pressable>
    </View>
  );
}