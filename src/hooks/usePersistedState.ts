// src/hooks/usePersistedState.ts
// Hook para persistir estado en AsyncStorage

import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Hook para persistir estado en AsyncStorage
 * @param key - Clave única para el storage
 * @param initialValue - Valor inicial
 * @returns [value, setValue] similar a useState pero persistido
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T) => Promise<void>] {
  const [value, setValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar valor guardado al montar
  useEffect(() => {
    const loadValue = async () => {
      try {
        const saved = await AsyncStorage.getItem(key);
        if (saved !== null) {
          setValue(JSON.parse(saved));
        }
      } catch (error) {
        console.warn(`Failed to load persisted state for key "${key}":`, error);
      } finally {
        setIsLoading(false);
      }
    };
    loadValue();
  }, [key]);

  // Guardar valor cuando cambie
  const setPersistedValue = async (newValue: T) => {
    try {
      setValue(newValue);
      await AsyncStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.warn(`Failed to persist state for key "${key}":`, error);
    }
  };

  // Retornar valor inicial mientras carga
  return [isLoading ? initialValue : value, setPersistedValue];
}




