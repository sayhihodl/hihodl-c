// app/index.tsx
import { useEffect } from "react";
import { router } from "expo-router";
import '@/shims/node';

export default function Index() {
  useEffect(() => {
    const id = setTimeout(() => {
      router.replace("/(drawer)/(tabs)"); // o "/(drawer)/(tabs)/(home)"
    }, 0);
    return () => clearTimeout(id);
  }, []);
  return null;
}