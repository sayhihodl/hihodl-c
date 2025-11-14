# 🚀 Lo que Falta para Lanzar en TestFlight

## ✅ Ya Está Listo

1. ✅ **Keystore Android** - Configurado
2. ✅ **EAS Secrets** - Configurados (según ESTADO_ACTUAL_LANZAMIENTO.md)
3. ✅ **URLs Legales** - Verificadas y funcionando
4. ✅ **Configuración iOS** - Info.plist completo
5. ✅ **Perfil TestFlight** - Creado en eas.json
6. ✅ **Script de Build** - `scripts/build-testflight.sh` listo

---

## ⚠️ Lo que Falta (4 Pasos)

### 1. Registrar App ID en Apple Developer Portal (5 min) ⚠️ ACTUAL

**PASO ACTUAL - Estás aquí:**

1. **Description**: `HIHODL iOS App`
2. **Bundle ID**: `com.sayhihodl.hihodlyes` (Explicit)
3. **Capabilities**: Marca las necesarias (App Attest ya está ✅)
4. **Continue** → **Register**

**Ver guía completa:** `GUIA_REGISTRO_APP_ID.md`

---

### 2. Configurar App Store Connect (15-30 min)

**Pasos:**

1. **Crear App en App Store Connect**
   - Ve a: https://appstoreconnect.apple.com
   - "My Apps" → "+" → "New App"
   - Completa:
     - Name: `HIHODL`
     - Bundle ID: `com.sayhihodl.hihodlyes`
     - SKU: `hihodl-ios-001` (o el que prefieras)

2. **Obtener IDs Necesarios**
   - **ascAppId**: En "App Information" → "Apple ID" (número)
   - **appleTeamId**: En Apple Developer Portal → "Membership" → "Team ID"
   - **appleId**: Tu email de Apple Developer

3. **Actualizar eas.json**
   ```json
   "submit": {
     "testflight": {
       "ios": {
         "appleId": "TU-EMAIL@example.com",
         "ascAppId": "1234567890",
         "appleTeamId": "ABCD123456"
       }
     }
   }
   ```

4. **Completar Información Mínima**
   - Privacy Policy URL: `https://hihodl.xyz/privacy` ✅
   - Support URL: `https://hihodl.xyz` (o crear `/support`)
   - Age Rating: Completar cuestionario

---

### 2. Verificar Variables de Entorno en EAS (5 min)

```bash
# Verificar que todas estén configuradas
eas secret:list
```

**Variables requeridas:**
- ✅ `EXPO_PUBLIC_SUPABASE_URL`
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- ✅ `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- ✅ `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- ✅ `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- ✅ `EXPO_PUBLIC_ALCHEMY_API_KEY`
- ✅ `EXPO_PUBLIC_HELIUS_API_KEY`
- ✅ `EXPO_PUBLIC_API_URL`
- ✅ `EXPO_PUBLIC_PRIVY_APP_ID`
- ✅ `EXPO_PUBLIC_PRIVY_CLIENT_ID`

**Si falta alguna:**
```bash
eas secret:create --scope project --name NOMBRE_VARIABLE --value "valor"
```

---

### 3. Hacer Build y Subir (30-60 min)

```bash
# Opción 1: Usar script
./scripts/build-testflight.sh

# Opción 2: Comando directo
eas build --platform ios --profile testflight
```

**Después del build:**
- El build aparecerá automáticamente en TestFlight (5-15 min)
- O usar: `eas submit --platform ios --profile testflight`

---

## 📋 Checklist Rápido

- [ ] App creada en App Store Connect
- [ ] IDs obtenidos (ascAppId, appleTeamId, appleId)
- [ ] `eas.json` actualizado con los IDs
- [ ] Variables de entorno verificadas en EAS
- [ ] Build ejecutado: `./scripts/build-testflight.sh`
- [ ] Build subido a TestFlight
- [ ] Testers agregados

---

## 🎯 Tiempo Total Estimado

- **Configuración App Store Connect**: 15-30 min
- **Verificación variables**: 5 min
- **Build**: 20-40 min
- **Procesamiento Apple**: 5-15 min
- **Total**: ~1-2 horas

---

## 📚 Documentación Completa

Ver `GUIA_TESTFLIGHT.md` para guía detallada paso a paso.

---

**Estado Actual:** Listo para configurar App Store Connect y hacer build 🚀

