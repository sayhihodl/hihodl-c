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

### 1. Android - Keystore de Producción ✅

**Estado:** ✅ Completado

- ✅ Keystore generado por EAS
- ✅ Configurado como default para producción
- ✅ Backup descargado y guardado
- ✅ Agregado al `.gitignore`

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

### 3. Variables de Entorno en EAS Secrets ✅

**Estado:** ✅ Completado

- ✅ Todas las variables configuradas en EAS Secrets
- ✅ `EXPO_PUBLIC_SUPABASE_URL` - Configurado
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Configurado
- ✅ `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` - Configurado
- ✅ `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` - Configurado
- ✅ `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID` - Configurado
- ✅ `EXPO_PUBLIC_ALCHEMY_API_KEY` - Configurado
- ✅ `EXPO_PUBLIC_HELIUS_API_KEY` - Configurado
- ✅ `EXPO_PUBLIC_API_URL` - Configurado
- ✅ `EXPO_PUBLIC_PRIVY_APP_ID` - Configurado
- ✅ `EXPO_PUBLIC_PRIVY_CLIENT_ID` - Configurado

---

### 4. URLs Legales ✅

**Estado:** ✅ Verificado y funcionando

**Requisitos:**
- ✅ Privacy Policy URL: `https://hihodl.xyz/privacy` (HTTP 200 - Funcionando)
- ✅ Terms of Service URL: `https://hihodl.xyz/terms` (HTTP 200 - Funcionando)
- ⚠️ Support URL (opcional pero recomendado) - Puede usar `https://hihodl.xyz`

**Ambas stores requieren estas URLs.**

---

### 5. Sincronizar Código con GitHub ⚠️

**Estado:** ⚠️ **CRÍTICO** - Código no sincronizado con GitHub

**Problema:** EAS Build usa el código de GitHub. Si no está sincronizado, el build puede fallar o usar código antiguo.

**Estado actual:**
- ⚠️ 9 commits sin hacer push
- ⚠️ ~100 archivos modificados sin commitear (incluye código fuente)
- ⚠️ Archivos nuevos sin trackear

**Solución:**
```bash
# Opción 1: Usar script automatizado
./scripts/prepare-git-push.sh

# Opción 2: Manual
git add -A
git commit -m "chore: sync codebase before production build"
git push origin main
```

**⚠️ IMPORTANTE:** Debes hacer push ANTES de hacer el build de producción.

---

### 6. Build de Producción Android ⚠️

**Estado:** ⚠️ Build completado pero puede estar desactualizado

- ✅ Build de producción Android completado
- ✅ Build ID: `234173fa-f91b-4fa7-8db2-ef7600b8d562`
- ✅ AAB generado: `https://expo.dev/artifacts/eas/5mvfdVJdXbWcRSznqtDEYA.aab`
- ⚠️ **IMPORTANTE:** Este build puede estar usando código antiguo si no hiciste push
- ⚠️ **Pendiente:** Hacer nuevo build después de sincronizar con GitHub
- ⚠️ **Pendiente:** Descargar y probar en dispositivo físico Android

**⚠️ IMPORTANTE:** Los links directos requieren autenticación en el NAVEGADOR (no solo en CLI).

**🔴 Si ves error 403 Forbidden:**
- El problema NO es de cuenta personal vs organización
- El problema es que tu NAVEGADOR no tiene sesión activa en expo.dev
- Aunque estés logueado en la CLI (`eas whoami`), el navegador necesita su propia sesión

**✅ SOLUCIÓN - Pasos para descargar:**

1. **Opción 1: Dashboard Web (RECOMENDADO) 🌐**
   ```bash
   # Paso 1: Abre este link en tu navegador
   https://expo.dev/accounts/sayhihodl/projects/hihodl-yes/builds
   
   # Paso 2: Si no estás logueado, inicia sesión con tu cuenta: sayhihodl
   
   # Paso 3: Busca el build con ID: 234173fa-f91b-4fa7-8db2-ef7600b8d562
   
   # Paso 4: Haz clic en el botón "Download" o en el link del artifact
   ```

2. **Opción 2: Link directo (desde navegador autenticado) 🔗**
   ```bash
   # Paso 1: Primero inicia sesión en expo.dev
   # Abre: https://expo.dev y loguéate con tu cuenta: sayhihodl
   
   # Paso 2: Luego abre este link en el MISMO navegador:
   https://expo.dev/artifacts/eas/5mvfdVJdXbWcRSznqtDEYA.aab
   ```

3. **Si el problema persiste (403 sigue apareciendo):**
   - Cierra TODAS las pestañas de expo.dev
   - Limpia las cookies del navegador para expo.dev
   - Inicia sesión nuevamente en: https://expo.dev
   - Abre el link del build en la misma sesión

4. **Usar script de ayuda:**
   ```bash
   ./scripts/download-build-auth.sh android
   ```

---

### 6. Testing en Dispositivos Físicos ⚠️

**Estado:** ⚠️ Pendiente - Build listo, falta probar

**Checklist:**
- [ ] Descargar AAB del build de producción
- [ ] Instalar en dispositivo Android físico
- [ ] Build de producción funciona en Android físico
- [ ] Todas las features principales funcionan
- [ ] Google Sign In funciona
- [ ] Apple Sign In funciona (cuando tengas certificados iOS)
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
1. ✅ **Android Keystore** - Completado
2. ✅ **EAS Secrets** - Completado
3. ✅ **URLs Legales** - Verificadas y funcionando
4. ✅ **Build de Producción Android** - Completado
5. ⚠️ **Testing en dispositivos físicos** - Build listo, falta probar en dispositivo
6. ⚠️ **Screenshots** - Necesarios para ambas stores

### 🟡 IMPORTANTE (Mejora la calidad)
7. ⚠️ **Crash Reporting** - Para monitorear errores en producción
8. ⚠️ **Store Listings completos** - Descripciones, screenshots, etc.
9. ⚠️ **Content Rating** - Requerido por ambas stores

### 🟢 OPCIONAL (Puede esperar)
10. ⏳ **Apple Developer Program** - Ya está en proceso
11. ⏳ **Analytics** - Si no está activado, activarlo o eliminar
12. ⏳ **App Preview videos** - Opcional pero ayuda

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

**Última actualización:** Actualizado con progreso actual
**Próximo paso:** Descargar build de Android y probar en dispositivo físico, luego preparar screenshots

