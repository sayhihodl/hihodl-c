# ✅ Checklist de Producción - HIHODL App

## 🚨 CRÍTICO - Debe estar listo antes de desplegar

### 1. Variables de Entorno y Configuración
- [ ] **Firebase Configuration**
  - [ ] `EXPO_PUBLIC_FIREBASE_API_KEY` - Actualmente tiene placeholder "..."
  - [ ] `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` - ✅ Configurado
  - [ ] `EXPO_PUBLIC_FIREBASE_PROJECT_ID` - ✅ Configurado
  - [ ] `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - ✅ Configurado
  - [ ] `EXPO_PUBLIC_FIREBASE_APP_ID` - ✅ Configurado

- [ ] **Google OAuth**
  - [ ] `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` - Actualmente tiene placeholder "xxxxxxxxxx..."
  - [ ] `EXPO_PUBLIC_GOOGLE_IOS_ID` - Falta en app.json (requerido por src/config/app.ts)
  - [ ] `EXPO_PUBLIC_GOOGLE_ANDROID_ID` - Falta en app.json (requerido por src/config/app.ts)

- [ ] **Blockchain RPCs**
  - [ ] `EXPO_PUBLIC_ALCHEMY_API_KEY` - Falta (requerido por src/chain/chains.ts)
  - [ ] `EXPO_PUBLIC_HELIUS_API_KEY` - Falta (requerido por src/chain/chains.ts)

- [ ] **API Backend**
  - [ ] `EXPO_PUBLIC_API_URL` - Falta (requerido por src/config/runtime.ts)

### 2. Android - Keystore para Producción
- [ ] **Generar keystore de producción**
  ```bash
  keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias hihodl-release -keyalg RSA -keysize 2048 -validity 10000
  ```
- [ ] **Configurar gradle.properties con credenciales**
- [ ] **Actualizar build.gradle** para usar keystore de producción en release builds
- [ ] ⚠️ ACTUALMENTE: Está usando `debug.keystore` para releases (INSEGURO)

### 3. iOS - Configuración
- [ ] **App Store Connect**
  - [ ] Crear App ID en Apple Developer Portal
  - [ ] Configurar Certificates & Profiles
  - [ ] Configurar App Store Connect listing

- [ ] **Info.plist adicionales**
  - [ ] `NSPhotoLibraryUsageDescription` (si usas galería)
  - [ ] `NSLocationWhenInUseUsageDescription` (si usas ubicación)
  - [ ] `ITSAppUsesNonExemptEncryption` - Declarar si usas encriptación

### 4. Versionado
- [ ] **Android**: Configurar versionCode automático en eas.json
- [ ] **iOS**: Configurar CFBundleVersion automático
- [ ] **app.json**: Agregar `version` y `runtimeVersion`

### 5. Splash Screen
- [ ] Configurar `splash` en app.json
- [ ] Verificar assets de splash screen existan

### 6. Crash Reporting
- [ ] Implementar Sentry o Firebase Crashlytics
- [ ] Configurar error boundaries para capturar crashes

### 7. URLs Legales
- [ ] Verificar que https://hihodl.xyz/terms existe y está actualizado
- [ ] Verificar que https://hihodl.xyz/privacy existe y está actualizado
- [ ] Agregar validación de URLs antes de abrir

### 8. Optimización de Builds
- [ ] **Android**:
  - [ ] Habilitar minifyEnabled en release
  - [ ] Configurar ProGuard rules correctamente
  - [ ] Habilitar shrinkResources
- [ ] **iOS**:
  - [ ] Configurar optimizaciones de build

## 📋 IMPORTANTE - Mejora la calidad

### 9. Testing
- [ ] Tests unitarios para lógica crítica
- [ ] Tests de integración para flujos principales
- [ ] QA manual completo de todas las features

### 10. Analytics y Monitoreo
- [ ] Activar Firebase Analytics (descomentar en app/_layout.tsx)
- [ ] Configurar dashboards de monitoreo
- [ ] Configurar alertas para errores críticos

### 11. Seguridad
- [ ] Revisar código para secrets hardcodeados
- [ ] Configurar Content Security Policy si aplica
- [ ] Verificar que no se logean datos sensibles

### 12. Performance
- [ ] Optimizar imágenes (WebP, compresión)
- [ ] Lazy loading de componentes pesados
- [ ] Optimizar bundle size
- [ ] Verificar que no hay memory leaks

### 13. App Store / Play Store
- [ ] **App Store Connect**:
  - [ ] Screenshots para todas las devices requeridas
  - [ ] Descripción de la app
  - [ ] Keywords
  - [ ] Categorías
  - [ ] Age rating
  - [ ] Privacy policy URL
  - [ ] Support URL
  - [ ] Marketing URL (opcional)

- [ ] **Google Play Console**:
  - [ ] Store listing completo
  - [ ] Screenshots
  - [ ] Feature graphic
  - [ ] Privacy policy URL
  - [ ] Content rating
  - [ ] Data safety form

### 14. Documentación
- [ ] README actualizado con instrucciones de build
- [ ] Documentación de variables de entorno
- [ ] Guía de deployment
- [ ] Documentación de arquitectura (opcional pero recomendado)

### 15. CI/CD
- [ ] Configurar EAS Build para builds automáticos
- [ ] Configurar GitHub Actions / CI para tests
- [ ] Automatizar deployment a stores

## 🔍 Verificación Final

Antes de submitir a stores:

- [ ] Build de producción funciona en device físico
- [ ] Todas las features principales funcionan
- [ ] No hay errores en consola en producción
- [ ] Performance es aceptable (startup time, navigation)
- [ ] UI/UX está pulida (no hay textos cortados, layouts rotos)
- [ ] Onboarding completo funciona
- [ ] Pagos envían/reciben correctamente
- [ ] Autenticación (Google/Apple) funciona
- [ ] Notificaciones funcionan (si aplica)

## 📝 Notas Importantes

1. **Variables de entorno**: NUNCA commits con valores reales. Usa EAS Secrets o similar.
2. **Keystore**: Guardar en lugar seguro, backup en lugar seguro separado.
3. **Versioning**: Siempre incrementar antes de cada release.
4. **Testing**: Probar en devices reales, no solo emuladores.

## 🚀 Próximos Pasos Inmediatos

1. ⚠️ **URGENTE**: Completar todas las variables de entorno faltantes
2. ⚠️ **URGENTE**: Configurar keystore de producción para Android
3. ⚠️ **URGENTE**: Verificar que todas las APIs externas funcionan
4. Completar configuración de splash screen
5. Implementar crash reporting
6. Testing exhaustivo antes de release

