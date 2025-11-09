# Native Swift Tab Bar - Setup Guide

He creado un módulo nativo Swift que implementa un UITabBar siguiendo las [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/tab-bars).

## 📁 Estructura Creada

```
modules/native-tab-bar/
├── ios/
│   └── NativeTabBarModule.swift    # Implementación Swift nativa
├── src/
│   ├── NativeTabBar.tsx            # Componente React Native wrapper
│   └── index.ts                     # Exports
├── package.json
└── expo-module.config.json
```

## ⚠️ Importante: Development Build Requerido

**Los módulos nativos NO funcionan en Expo Go.** Necesitas crear un development build.

## 🚀 Pasos para Probar

### Opción 1: Development Build Local

```bash
# 1. Prebuild para generar carpetas nativas iOS/Android
npx expo prebuild

# 2. Instalar pods (si es la primera vez)
cd ios
pod install
cd ..

# 3. Ejecutar en iOS
npx expo run:ios

# O abrir en Xcode
open ios/*.xcworkspace
```

### Opción 2: EAS Build (Recomendado)

```bash
# 1. Instalar EAS CLI si no lo tienes
npm install -g eas-cli

# 2. Login
eas login

# 3. Crear development build
eas build --profile development --platform ios

# 4. Instalar en tu dispositivo
# Descarga el .ipa desde EAS y instálalo
```

## 📝 Activar el Tab Bar Nativo

Una vez tengas el development build funcionando:

1. Edita `app/(drawer)/(tabs)/_layout.tsx`:

```typescript
import React from "react";
import { Platform } from "react-native";
import NativeTabBarWrapper from "@/components/NativeTabBarWrapper";
import DefaultTabBar from "./DefaultTabBar";

export default function TabsLayout() {
  if (Platform.OS === "ios") {
    return <NativeTabBarWrapper />;
  }
  return <DefaultTabBar />;
}
```

2. Descomenta el import en `src/components/NativeTabBarWrapper.tsx`

## 🎨 Características del Tab Bar Nativo

✅ **UITabBar nativo de iOS** - Usa el componente real de Apple
✅ **Blur effect nativo** - `UIVisualEffectView` con `systemUltraThinMaterialDark`
✅ **SF Symbols** - Iconos del sistema nativos
✅ **Haptic Feedback** - Feedback háptico nativo al tocar
✅ **Seguimiento de HIG** - Cumple con las guías de diseño de Apple
✅ **Adaptive Colors** - Se adapta a light/dark mode automáticamente

## 🔧 Configuración del Módulo

El módulo está configurado en:
- `modules/native-tab-bar/expo-module.config.json` - Configuración del módulo
- `modules/native-tab-bar/ios/NativeTabBarModule.swift` - Código Swift

## 📚 Referencias

- [Apple HIG - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Expo Modules API](https://docs.expo.dev/modules/overview/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)

## 🐛 Troubleshooting

### Error: "Native module not found"
- Asegúrate de haber hecho `expo prebuild`
- Verifica que el módulo esté en `modules/` (no `node_modules/`)

### Error: "Cannot find module"
- Verifica que `expo-modules-core` esté instalado
- Ejecuta `npx expo install expo-modules-core`

### No se ve el tab bar
- Verifica que estés usando development build (no Expo Go)
- Revisa los logs de Xcode para errores

## 💡 Alternativa Rápida (Sin Development Build)

Si necesitas probar ahora mismo sin crear un development build, el `DefaultTabBar` actual funciona perfectamente y usa `expo-blur` que sí funciona en Expo Go.






