// src/hooks/useOnboardingProgress.ts
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PROGRESS_KEY = 'hihodl_onboarding_progress';

type OnboardingStep = 
  | 'splash'
  | 'carousel'
  | 'entry'
  | 'email'
  | 'username'
  | 'notifications'
  | 'security'
  | 'pin-setup'
  | 'principalaccount'
  | 'success';

export function useOnboardingProgress() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('splash');
  const [isLoading, setIsLoading] = useState(true);

  // Cargar progreso guardado
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const saved = await AsyncStorage.getItem(PROGRESS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as { step: OnboardingStep; timestamp: number };
          // Solo restaurar si fue hace menos de 24 horas
          const hoursAgo = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
          if (hoursAgo < 24) {
            setCurrentStep(parsed.step);
          } else {
            // Limpiar si es muy viejo
            await AsyncStorage.removeItem(PROGRESS_KEY);
          }
        }
      } catch (e) {
        // Ignorar errores
      } finally {
        setIsLoading(false);
      }
    };
    loadProgress();
  }, []);

  const saveProgress = async (step: OnboardingStep) => {
    try {
      await AsyncStorage.setItem(
        PROGRESS_KEY,
        JSON.stringify({ step, timestamp: Date.now() })
      );
      setCurrentStep(step);
    } catch (e) {
      // Ignorar errores
    }
  };

  const clearProgress = async () => {
    try {
      await AsyncStorage.removeItem(PROGRESS_KEY);
      setCurrentStep('splash');
    } catch (e) {
      // Ignorar errores
    }
  };

  return {
    currentStep,
    isLoading,
    saveProgress,
    clearProgress,
  };
}

