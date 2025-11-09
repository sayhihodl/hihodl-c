# Guía para Probar en Simulador iOS

## ✅ Simuladores Disponibles

Se detectaron estos simuladores:
- iPhone 16 Pro
- iPhone 16 Pro Max  
- iPhone 16e
- iPhone 16
- iPhone 16 Plus

## 🚀 Opciones para Ejecutar

### Opción 1: Xcode (Recomendado - Más Fácil)

```bash
# 1. Abrir proyecto en Xcode
open ios/HIHODL.xcworkspace
```

**En Xcode:**
1. Arriba a la izquierda, selecciona un simulador (ej: "iPhone 16 Pro")
2. Presiona **Cmd+R** o el botón "Play" ▶️
3. **NO requiere certificados** para simulador

### Opción 2: Terminal con Simulador Específico

```bash
# Listar simuladores disponibles
xcrun simctl list devices available

# Ejecutar en simulador específico
npx expo run:ios --device "iPhone 16 Pro"
```

### Opción 3: Forzar Modo Simulador

```bash
# Especificar que es simulador (no dispositivo físico)
npx expo run:ios -d
```

## ⚠️ Si Sigue Pidiendo Certificados

Puede ser que Expo esté intentando usar un dispositivo físico. Solución:

1. **Desconecta cualquier iPhone físico** de tu Mac
2. **O especifica simulador explícitamente:**

```bash
# Ver simuladores disponibles
xcrun simctl list devices available

# Usar un simulador específico
npx expo run:ios --device "iPhone 16 Pro"
```

## 📱 El Tab Bar Actual

Mientras tanto, el `DefaultTabBar` ya está funcionando:
- ✅ Funciona en Expo Go
- ✅ Funciona en development build
- ✅ Tiene blur effect nativo (expo-blur)
- ✅ Animaciones suaves

Puedes verlo funcionando en el simulador ahora mismo.

## 🔧 Troubleshooting

**Error: "No code signing certificates"**
- Asegúrate de no tener dispositivos físicos conectados
- Usa Xcode directamente (más confiable)

**Error: "No simulators found"**
- Instala simuladores en Xcode: `Preferences > Components > Simulators`

**App no se abre**
- Espera a que termine de compilar (puede tardar 2-5 minutos la primera vez)
- Revisa la consola de Xcode para errores






