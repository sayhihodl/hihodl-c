// app/index.tsx
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Espera a que el RootLayout esté montado
    const id = setTimeout(() => {
          router.replace("/(tabs)");
    }, 0);
    return () => clearTimeout(id);
  }, []);
  return null;
}