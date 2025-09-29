// src/lib/google-auth.ts
import { Alert, Platform } from 'react-native';
import { isExpoGo } from './runtime';

export async function signInWithGoogle(): Promise<void> {
  if (isExpoGo) {
    Alert.alert(
      'Google Sign-In',
      'En Expo Go no es posible iniciar sesión con Google. Usa email para testear. ' +
      'Al final activaremos el login nativo con un build de desarrollo.'
    );
    return;
  }

  // 🔜 Camino nativo (cuando hagamos dev build):
  // 1) Configurar GoogleSignin.configure({ webClientId: '...' })
  // 2) const { idToken } = await GoogleSignin.signIn();
  // 3) const credential = GoogleAuthProvider.credential(idToken);
  // 4) await signInWithCredential(auth, credential);

  // De momento, si alguien llega aquí sin build nativo:
  throw new Error('Google Sign-In se activará en el build nativo.');
}