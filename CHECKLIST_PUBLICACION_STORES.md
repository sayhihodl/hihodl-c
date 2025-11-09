# 📱 Checklist para Publicar en App Store y Play Store

## ✅ LO QUE YA ESTÁ LISTO

### Configuración Base
- ✅ `app.json` configurado con bundle IDs correctos
- ✅ Splash screen configurado
- ✅ Iconos y adaptive icons configurados
- ✅ Permisos configurados (cámara, biometría)
- ✅ Google OAuth configurado (Client IDs en .env)
- ✅ Supabase configurado
- ✅ API Backend URL configurada
- ✅ Alchemy API Key configurada
- ✅ EAS Build configurado (`eas.json`)

### iOS
- ✅ Bundle ID: `com.sayhihodl.hihodlyes`
- ✅ Info.plist con descripciones de permisos
- ✅ `ITSAppUsesNonExemptEncryption: false` configurado
- ⏳ Apple Developer Program (pendiente aprobación)

### Android
- ✅ Package: `com.sayhihodl.hihodlyes`
- ✅ Permisos configurados
- ✅ Google Services configurado
- ✅ ProGuard y optimizaciones habilitadas

---

## 🚨 CRÍTICO - Debe estar listo ANTES de publicar

### 1. Android - Keystore de Producción ⚠️

**Estado:** ❌ Falta

```bash
# Generar keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias hihodl-release \
  -keyalg RSA -keysize 2048 -validity 10000

# Guardar en lugar seguro y configurar en EAS:
eas credentials
```

**Pasos:**
- [ ] Generar keystore de producción
- [ ] Guardar keystore y passwords en lugar seguro
- [ ] Configurar en EAS: `eas credentials` → Android → Production keystore
- [ ] Hacer backup del keystore en lugar separado

---

### 2. iOS - Apple Developer Program ⏳

**Estado:** ⏳ Pendiente aprobación

**Pasos cuando te aprueben:**
- [ ] Crear App ID en Apple Developer Portal
- [ ] Configurar Certificates & Profiles
- [ ] Crear app en App Store Connect
- [ ] Actualizar `eas.json` con credenciales reales:
  ```json
  "ios": {
    "appleId": "tu-email@example.com",
    "ascAppId": "tu-app-id",
    "appleTeamId": "tu-team-id"
  }
  ```

---

### 3. Variables de Entorno en EAS Secrets ⚠️

**Estado:** ❌ Falta configurar en EAS

**Configurar TODAS las variables en EAS Secrets:**

```bash
# Instalar EAS CLI si no lo tienes
npm install -g eas-cli

# Login
eas login

# Configurar secrets (reemplaza con tus valores reales)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://gctwjvfpwkirtybzbnmu.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-anon-key"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "928131091332-lmsnu9rdcc32heclu7jd8s6pdimov2s6.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "928131091332-7l9dl952ld1sbutm8t8uucjjoi79mj63.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "928131091332-jcgolg7uk2mbsdbh6q9fqcthhqmugofi.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_ALCHEMY_API_KEY --value "0W91EqeROoUy2tO315BPK"
eas secret:create --scope project --name EXPO_PUBLIC_HELIUS_API_KEY --value "tu-helius-key"
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://hihodl-backend-v-0-1.onrender.com/api/v1"
eas secret:create --scope project --name EXPO_PUBLIC_PRIVY_APP_ID --value "tu-privy-app-id"
eas secret:create --scope project --name EXPO_PUBLIC_PRIVY_CLIENT_ID --value "tu-privy-client-id"
```

**Checklist:**
- [ ] Todas las variables configuradas en EAS Secrets
- [ ] Verificar que no hay valores placeholder

---

### 4. URLs Legales ⚠️

**Estado:** ❌ Verificar que existan

**Requisitos:**
- [ ] Privacy Policy URL: `https://hihodl.xyz/privacy` (debe existir y estar actualizada)
- [ ] Terms of Service URL: `https://hihodl.xyz/terms` (debe existir y estar actualizada)
- [ ] Support URL (opcional pero recomendado)

**Ambas stores requieren estas URLs.**

---

### 5. Testing en Dispositivos Físicos ⚠️

**Estado:** ❌ Falta

**Checklist:**
- [ ] Build de producción funciona en iPhone físico
- [ ] Build de producción funciona en Android físico
- [ ] Todas las features principales funcionan
- [ ] Google Sign In funciona
- [ ] Apple Sign In funciona (cuando tengas certificados)
- [ ] No hay crashes
- [ ] Performance aceptable (startup time, navegación)

---

## 📋 IMPORTANTE - Store Listings

### Google Play Store

**Requisitos obligatorios:**
- [ ] **Store Listing:**
  - [ ] Nombre corto (30 caracteres)
  - [ ] Descripción completa (4000 caracteres)
  - [ ] Descripción corta (80 caracteres)
  - [ ] Screenshots (mínimo 2, máximo 8)
    - Teléfono: 16:9 o 9:16, mínimo 320px
    - Tablet (7"): 16:9 o 9:16
    - Tablet (10"): 16:9 o 9:16
  - [ ] Feature graphic (1024 x 500px)
  - [ ] Icono de la app (512 x 512px)
  
- [ ] **Content Rating:**
  - [ ] Completar cuestionario de clasificación de contenido
  - [ ] Obtener rating (PEGI, ESRB, etc.)

- [ ] **Data Safety:**
  - [ ] Completar formulario de Data Safety
  - [ ] Declarar qué datos se recopilan
  - [ ] Declarar cómo se usan los datos

- [ ] **Privacy Policy:**
  - [ ] URL de política de privacidad (obligatorio)

- [ ] **App Access:**
  - [ ] Declarar si la app requiere cuenta
  - [ ] Declarar si hay compras in-app

**Opcional pero recomendado:**
- [ ] Video promocional (YouTube)
- [ ] Capturas de tablet
- [ ] Capturas en diferentes idiomas

---

### App Store (iOS)

**Requisitos obligatorios:**
- [ ] **App Information:**
  - [ ] Nombre (30 caracteres)
  - [ ] Subtítulo (30 caracteres)
  - [ ] Descripción (4000 caracteres)
  - [ ] Keywords (100 caracteres, separados por comas)
  - [ ] Categoría primaria
  - [ ] Categoría secundaria (opcional)
  - [ ] Age rating (completar cuestionario)

- [ ] **Screenshots:**
  - [ ] iPhone 6.7" (1290 x 2796px) - REQUERIDO
  - [ ] iPhone 6.5" (1284 x 2778px) - REQUERIDO
  - [ ] iPhone 5.5" (1242 x 2208px) - Opcional
  - [ ] iPad Pro 12.9" (2048 x 2732px) - Si soporta iPad
  - [ ] iPad Pro 11" (1668 x 2388px) - Si soporta iPad

- [ ] **App Icon:**
  - [ ] 1024 x 1024px (sin transparencia, sin esquinas redondeadas)

- [ ] **Privacy Policy:**
  - [ ] URL de política de privacidad (obligatorio)

- [ ] **Support URL:**
  - [ ] URL de soporte (obligatorio)

**Opcional pero recomendado:**
- [ ] App Preview video
- [ ] Screenshots en diferentes idiomas
- [ ] Marketing URL

---

## 🔧 Configuración Técnica Adicional

### 6. Crash Reporting ⚠️

**Estado:** ❌ Falta

**Opciones:**
- [ ] Implementar Sentry (recomendado)
- [ ] O Firebase Crashlytics
- [ ] Configurar error boundaries

**Por qué es importante:** Necesitas saber si hay crashes en producción.

---

### 7. Analytics ⚠️

**Estado:** ⏳ Verificar

- [ ] Activar analytics (Firebase, Mixpanel, etc.)
- [ ] O eliminar completamente si no se usa
- [ ] Configurar eventos importantes

---

### 8. Optimización de Builds ✅

**Estado:** ✅ Ya configurado

- ✅ ProGuard habilitado (Android)
- ✅ Minify habilitado
- ✅ Shrink resources habilitado

---

### 9. Versionado ✅

**Estado:** ✅ Configurado

- ✅ `autoIncrement: true` en `eas.json`
- ✅ Version en `app.json`: `1.0.0`

**Nota:** EAS incrementará automáticamente el versionCode/buildNumber en cada build.

---

## 📤 Proceso de Publicación

### Google Play Store

**Primera vez:**
1. [ ] Crear cuenta en [Google Play Console](https://play.google.com/console/)
2. [ ] Pagar fee de registro ($25, una sola vez)
3. [ ] Crear nueva app
4. [ ] Completar Store Listing (screenshots, descripción, etc.)
5. [ ] Completar Content Rating
6. [ ] Completar Data Safety form
7. [ ] Build de producción: `eas build --platform android --profile production`
8. [ ] Subir AAB manualmente la primera vez
9. [ ] O usar: `eas submit --platform android --profile production` (requiere Service Account)

**Para siguientes releases:**
- [ ] Incrementar versión
- [ ] Build: `eas build --platform android --profile production`
- [ ] Submit: `eas submit --platform android --profile production`

---

### App Store (iOS)

**Primera vez (cuando tengas Apple Developer):**
1. [ ] Crear app en [App Store Connect](https://appstoreconnect.apple.com/)
2. [ ] Completar App Information
3. [ ] Subir screenshots y metadata
4. [ ] Completar Age Rating
5. [ ] Build de producción: `eas build --platform ios --profile production`
6. [ ] Subir IPA: `eas submit --platform ios --profile production`
7. [ ] Completar información de export compliance
8. [ ] Submit para review

**Para siguientes releases:**
- [ ] Incrementar versión
- [ ] Build: `eas build --platform ios --profile production`
- [ ] Submit: `eas submit --platform ios --profile production`

---

## 🎯 Prioridad de Tareas

### 🔴 URGENTE (Antes de publicar)
1. ⚠️ **Android Keystore** - Sin esto no puedes publicar en Play Store
2. ⚠️ **EAS Secrets** - Configurar todas las variables de entorno
3. ⚠️ **URLs Legales** - Privacy Policy y Terms (requerido por ambas stores)
4. ⚠️ **Testing en dispositivos físicos** - Verificar que todo funciona
5. ⚠️ **Screenshots** - Necesarios para ambas stores

### 🟡 IMPORTANTE (Mejora la calidad)
6. ⚠️ **Crash Reporting** - Para monitorear errores en producción
7. ⚠️ **Store Listings completos** - Descripciones, screenshots, etc.
8. ⚠️ **Content Rating** - Requerido por ambas stores

### 🟢 OPCIONAL (Puede esperar)
9. ⏳ **Apple Developer Program** - Ya está en proceso
10. ⏳ **Analytics** - Si no está activado, activarlo o eliminar
11. ⏳ **App Preview videos** - Opcional pero ayuda

---

## 📝 Notas Importantes

1. **Keystore Android:** Si lo pierdes, NO podrás actualizar tu app. Guarda backup seguro.
2. **Bundle IDs:** No se pueden cambiar después de publicar. Verifica que estén correctos.
3. **Versioning:** Siempre incrementa antes de cada release.
4. **Testing:** Prueba en dispositivos reales, no solo emuladores.
5. **Review Times:**
   - Google Play: 1-3 días (generalmente)
   - App Store: 1-7 días (puede ser más largo)

---

## ✅ Checklist Final Pre-Submit

Antes de enviar a las stores, verifica:

- [ ] Build de producción funciona en device físico
- [ ] Todas las features principales funcionan
- [ ] No hay errores en consola en producción
- [ ] Performance es aceptable
- [ ] UI/UX está pulida (no hay textos cortados, layouts rotos)
- [ ] Onboarding completo funciona
- [ ] Google Sign In funciona
- [ ] URLs legales están actualizadas y funcionan
- [ ] Screenshots listos
- [ ] Descripciones escritas
- [ ] Version number incrementado
- [ ] Todas las variables de entorno configuradas en EAS
- [ ] Keystore configurado (Android)
- [ ] Certificados configurados (iOS)

---

## 🚀 Comandos Rápidos

```bash
# Configurar EAS
npm install -g eas-cli
eas login

# Configurar credenciales
eas credentials

# Build de producción
eas build --platform android --profile production
eas build --platform ios --profile production

# Submit a stores
eas submit --platform android --profile production
eas submit --platform ios --profile production

# Ver builds
eas build:list
```

---

**Última actualización:** Basado en el estado actual del proyecto
**Próximo paso:** Configurar Android Keystore y EAS Secrets

