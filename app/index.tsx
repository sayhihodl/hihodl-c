// app/index.tsx
import { useEffect, useRef } from "react";
import { router, useRouter } from "expo-router";
import { useAppStore } from "@/store/app.store";
import { useAuth } from "@/store/auth";
import { isLockEnabled } from "@/lib/lock";
import '@/shims/node';

export default function Index() {
  const { onboardingDone, hydrated } = useAppStore();
  const { isAuthenticated, ready: authReady } = useAuth();
  const navigatedRef = useRef(false);
  const routerInstance = useRouter();

  useEffect(() => {
    if (!hydrated || !authReady) return; // Esperar a que se hidrate el store y auth
    if (navigatedRef.current) return; // Evitar múltiples navegaciones

    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const navigate = async () => {
      if (!mounted || navigatedRef.current) return;
      
      // Verificar que el router esté disponible
      if (!routerInstance) {
        // Si el router no está listo, reintentar después de un breve delay
        timeoutId = setTimeout(() => {
          if (mounted && !navigatedRef.current) {
            navigate();
          }
        }, 100);
        return;
      }

      navigatedRef.current = true;

      try {
        // Si no está autenticado, ir a "How do you want to start?" (choose)
        if (!isAuthenticated) {
          router.replace("/auth/choose");
          return;
        }

        // Si está autenticado pero no completó el onboarding, ir al splash del onboarding
        if (!onboardingDone) {
          router.replace("/onboarding/splash");
          return;
        }

        // Si ya completó el onboarding, verificar si el lock está habilitado
        // isLockEnabled() ahora verifica que realmente haya PIN/biometría configurado
        const lockEnabled = await isLockEnabled();
        if (lockEnabled) {
          // Si el lock está habilitado y hay credenciales, mostrar pantalla de desbloqueo
          router.replace("/auth/lock");
        } else {
          // Si no hay lock o no hay credenciales configuradas, ir directamente al dashboard
          router.replace("/(drawer)/(tabs)/(home)");
        }
      } catch (error) {
        console.error('[Index] Navigation error:', error);
        if (mounted) {
          navigatedRef.current = false; // Reset en caso de error
        }
      }
    };

    // Pequeño delay para asegurar que el router esté completamente inicializado
    timeoutId = setTimeout(() => {
      navigate();
    }, 200);
    
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onboardingDone, hydrated, isAuthenticated, authReady, routerInstance]);

  return null;
}