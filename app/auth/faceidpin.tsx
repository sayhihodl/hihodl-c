// app/auth/faceidpin.tsx
import { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

export default function FaceIdPinAlias() {
  useEffect(() => {
    router.replace('/auth/lock');
  }, []);

  // vista vacía mientras navega
  return <View style={{ flex: 1, backgroundColor: '#0E1722' }} />;
}