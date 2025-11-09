# 🚀 Lo que Falta para Lanzar HIHODL

## 🔴 CRÍTICO - Sin esto NO puedes publicar

### 1. Android Keystore de Producción ⚠️
**Tiempo:** 5 minutos  
**Estado:** ❌ Falta

```bash
# Generar keystore
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias hihodl-release \
  -keyalg RSA -keysize 2048 -validity 10000

# Configurar en EAS
eas credentials
# → Seleccionar Android → Production keystore → Upload
```

**Checklist:**
- [ ] Generar keystore
- [ ] Guardar keystore y passwords en lugar SEGURO (si lo pierdes, no podrás actualizar la app)
- [ ] Configurar en EAS: `eas credentials`
- [ ] Hacer backup del keystore

---

### 2. Variables de Entorno en EAS Secrets ⚠️
**Tiempo:** 15 minutos  
**Estado:** ❌ Falta

Las variables están en `.env` pero NO en EAS Secrets (necesario para builds de producción).

```bash
# Instalar EAS CLI si no lo tienes
npm install -g eas-cli
eas login

# Configurar TODAS las variables (reemplaza con tus valores reales)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://gctwjvfpwkirtybzbnmu.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "tu-anon-key"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "928131091332-lmsnu9rdcc32heclu7jd8s6pdimov2s6.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "928131091332-7l9dl952ld1sbutm8t8uucjjoi79mj63.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "928131091332-jcgolg7uk2mbsdbh6q9fqcthhqmugofi.apps.googleusercontent.com"
eas secret:create --scope project --name EXPO_PUBLIC_ALCHEMY_API_KEY --value "0W91EqeROoUy2tO315BPK"
eas secret:create --scope project --name EXPO_PUBLIC_HELIUS_API_KEY --value "83b907ca-a824-4e0f-bfcd-c17ce3e1f8cc"
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://hihodl-backend-v-0-1.onrender.com/api/v1"
```

**Checklist:**
- [ ] Todas las variables configuradas en EAS Secrets
- [ ] Verificar que no hay valores placeholder

---

### 3. URLs Legales ⚠️
**Tiempo:** 10 minutos  
**Estado:** ❌ Verificar que existan

**Requisitos (obligatorio para ambas stores):**
- [ ] Privacy Policy: `https://hihodl.xyz/privacy` (debe existir y estar actualizada)
- [ ] Terms of Service: `https://hihodl.xyz/terms` (debe existir y estar actualizada)

**Acción:**
1. Verificar que las URLs funcionan
2. Asegurarse de que el contenido está actualizado
3. Si no existen, crearlas o actualizarlas

---

### 4. Testing en Dispositivos Físicos ⚠️
**Tiempo:** 1-2 horas  
**Estado:** ❌ Falta

**Checklist:**
- [ ] Build de producción funciona en iPhone físico
- [ ] Build de producción funciona en Android físico
- [ ] Todas las features principales funcionan
- [ ] Google Sign In funciona
- [ ] No hay crashes
- [ ] Performance aceptable (startup time, navegación)

**Comandos:**
```bash
# Build de producción para testing
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

### 5. Screenshots para Stores ⚠️
**Tiempo:** 1-2 horas  
**Estado:** ❌ Falta

**Google Play Store:**
- [ ] Screenshots (mínimo 2, máximo 8)
  - Teléfono: 16:9 o 9:16, mínimo 320px
- [ ] Feature graphic (1024 x 500px)

**App Store (iOS):**
- [ ] iPhone 6.7" (1290 x 2796px) - REQUERIDO
- [ ] iPhone 6.5" (1284 x 2778px) - REQUERIDO

---

## 🟡 IMPORTANTE - Mejora la calidad

### 6. Crash Reporting ⚠️
**Tiempo:** 30 minutos  
**Estado:** Código preparado pero NO activado

**Archivo:** `app/_layout.tsx` (líneas comentadas)

**Opciones:**
- [ ] Sentry (recomendado)
- [ ] Firebase Crashlytics

**Pasos:**
1. Elegir servicio
2. Instalar dependencias
3. Descomentar código en `app/_layout.tsx`
4. Configurar DSN/credenciales

---

### 7. Store Listings Completos ⚠️
**Tiempo:** 2-3 horas  
**Estado:** ❌ Falta

**Google Play Store:**
- [ ] Nombre corto (30 caracteres)
- [ ] Descripción completa (4000 caracteres)
- [ ] Descripción corta (80 caracteres)
- [ ] Content Rating (completar cuestionario)
- [ ] Data Safety form (completar)

**App Store:**
- [ ] Nombre (30 caracteres)
- [ ] Subtítulo (30 caracteres)
- [ ] Descripción (4000 caracteres)
- [ ] Keywords (100 caracteres)
- [ ] Categorías
- [ ] Age rating (completar cuestionario)

---

### 8. iOS - Apple Developer Program ⏳
**Tiempo:** Depende de aprobación de Apple  
**Estado:** ⏳ Pendiente aprobación

**Cuando te aprueben:**
- [ ] Crear App ID en Apple Developer Portal
- [ ] Configurar Certificates & Profiles
- [ ] Crear app en App Store Connect
- [ ] Actualizar `eas.json` con credenciales

---

## 📊 Resumen por Prioridad

### 🔴 URGENTE (Hacer AHORA)
1. ❌ **Android Keystore** (5 min)
2. ❌ **EAS Secrets** (15 min)
3. ❌ **URLs Legales** (10 min)
4. ❌ **Testing en dispositivos físicos** (1-2 horas)
5. ❌ **Screenshots** (1-2 horas)

**Total tiempo estimado:** ~3-4 horas

### 🟡 IMPORTANTE (Hacer después)
6. ⚠️ **Crash Reporting** (30 min)
7. ⚠️ **Store Listings** (2-3 horas)
8. ⏳ **Apple Developer** (pendiente aprobación)

---

## 🚀 Proceso de Lanzamiento

### Para Android (Google Play Store):

1. **Preparación:**
   ```bash
   # 1. Configurar EAS Secrets
   eas secret:create --scope project --name EXPO_PUBLIC_...
   
   # 2. Configurar keystore
   eas credentials
   
   # 3. Build de producción
   eas build --platform android --profile production
   ```

2. **En Google Play Console:**
   - [ ] Crear cuenta (si no tienes)
   - [ ] Pagar fee de registro ($25, una sola vez)
   - [ ] Crear nueva app
   - [ ] Completar Store Listing (screenshots, descripción)
   - [ ] Completar Content Rating
   - [ ] Completar Data Safety form
   - [ ] Subir AAB: `eas submit --platform android --profile production`

3. **Esperar review:** 1-3 días

---

### Para iOS (App Store):

1. **Esperar aprobación de Apple Developer Program**

2. **Cuando te aprueben:**
   ```bash
   # 1. Configurar certificados
   eas credentials
   
   # 2. Build de producción
   eas build --platform ios --profile production
   
   # 3. Submit
   eas submit --platform ios --profile production
   ```

3. **En App Store Connect:**
   - [ ] Completar App Information
   - [ ] Subir screenshots
   - [ ] Completar Age Rating
   - [ ] Submit para review

4. **Esperar review:** 1-7 días

---

## ✅ Checklist Final Pre-Submit

Antes de enviar a las stores:

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

## 📝 Comandos Rápidos

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
```

---

## 🎯 Próximos Pasos Inmediatos

1. **Generar Android Keystore** (5 min) ⚠️
2. **Configurar EAS Secrets** (15 min) ⚠️
3. **Verificar URLs Legales** (10 min) ⚠️
4. **Testing en dispositivos físicos** (1-2 horas) ⚠️
5. **Preparar Screenshots** (1-2 horas) ⚠️

**Total tiempo mínimo:** ~3-4 horas de trabajo

---

**Última actualización:** Basado en el estado actual del proyecto  
**Estado general:** ~60% completo - Faltan elementos críticos para producción

