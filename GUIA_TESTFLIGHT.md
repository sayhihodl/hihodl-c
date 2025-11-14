# 🚀 Guía Completa para Lanzar en TestFlight

## ✅ Lo que Ya Está Listo

1. ✅ **Keystore Android** - Configurado en EAS
2. ✅ **EAS Secrets** - Todas las variables configuradas
3. ✅ **URLs Legales** - Verificadas y funcionando
   - Privacy: https://hihodl.xyz/privacy ✅
   - Terms: https://hihodl.xyz/terms ✅
4. ✅ **Configuración iOS** - Info.plist configurado correctamente
5. ✅ **Perfil de Build TestFlight** - Creado en `eas.json`
6. ✅ **Script de Build** - `scripts/build-testflight.sh` listo

---

## ⚠️ Lo que Falta Configurar

### 1. App Store Connect - Configuración Inicial

**Antes de hacer el build, necesitas:**

#### a) Crear App en App Store Connect
1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Inicia sesión con tu cuenta de Apple Developer
3. Ve a "My Apps" → "+" → "New App"
4. Completa:
   - **Platform**: iOS
   - **Name**: HIHODL
   - **Primary Language**: English (o el que prefieras)
   - **Bundle ID**: `com.sayhihodl.hihodlyes` (debe coincidir con app.json)
   - **SKU**: Un identificador único (ej: `hihodl-ios-001`)
   - **User Access**: Full Access (o el que necesites)

#### b) Obtener IDs Necesarios
Después de crear la app, necesitarás:

1. **App Store Connect App ID** (`ascAppId`):
   - Ve a tu app en App Store Connect
   - Ve a "App Information"
   - Copia el "Apple ID" (es un número, ej: `1234567890`)

2. **Team ID** (`appleTeamId`):
   - Ve a [Apple Developer Portal](https://developer.apple.com/account)
   - Ve a "Membership"
   - Copia el "Team ID" (ej: `ABCD123456`)

3. **Apple ID** (`appleId`):
   - El email de tu cuenta de Apple Developer

#### c) Actualizar eas.json
Una vez tengas los IDs, actualiza `eas.json`:

```json
"submit": {
  "testflight": {
    "ios": {
      "appleId": "tu-email@example.com",
      "ascAppId": "1234567890",
      "appleTeamId": "ABCD123456"
    }
  }
}
```

---

### 2. App Store Connect - Información Requerida

**Mínimo necesario para TestFlight:**

#### a) Información Básica
- [ ] **App Name**: HIHODL
- [ ] **Bundle ID**: `com.sayhihodl.hihodlyes` ✅ (ya configurado)
- [ ] **Privacy Policy URL**: https://hihodl.xyz/privacy ✅ (ya verificada)
- [ ] **Support URL**: Necesitas crear una página de soporte
  - Ejemplo: https://hihodl.xyz/support
  - O usar: https://hihodl.xyz (temporal)

#### b) Age Rating
- [ ] Completar cuestionario de Age Rating
- [ ] Seleccionar categorías apropiadas

#### c) Screenshots (Opcional para TestFlight, pero recomendado)
- [ ] iPhone 6.7" (1290 x 2796px) - Mínimo 1 screenshot
- [ ] iPhone 6.5" (1284 x 2778px) - Mínimo 1 screenshot

**Nota:** Para TestFlight puedes subir sin screenshots, pero es mejor tenerlos.

---

## 🚀 Proceso de Lanzamiento en TestFlight

### Paso 1: Configurar App Store Connect

1. Crea la app en App Store Connect (ver arriba)
2. Completa la información básica
3. Obtén los IDs necesarios
4. Actualiza `eas.json` con los IDs

### Paso 2: Verificar Variables de Entorno

Asegúrate de que todas las variables estén configuradas en EAS:

```bash
# Verificar secrets configurados
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

### Paso 3: Hacer el Build

```bash
# Opción 1: Usar el script (recomendado)
./scripts/build-testflight.sh

# Opción 2: Comando directo
eas build --platform ios --profile testflight
```

**Tiempo estimado:** 20-40 minutos

**Puedes ver el progreso en:**
- Dashboard: https://expo.dev/accounts/sayhihodl/projects/hihodl-yes/builds
- O con: `eas build:list`

### Paso 4: Subir a TestFlight

**Opción A: Automático (si configuraste los IDs en eas.json)**

```bash
eas submit --platform ios --profile testflight
```

**Opción B: Manual**

1. Ve a [App Store Connect](https://appstoreconnect.apple.com)
2. Selecciona tu app
3. Ve a la pestaña "TestFlight"
4. El build aparecerá automáticamente (puede tomar 5-15 minutos)
5. Una vez procesado, aparecerá en "iOS Builds"

### Paso 5: Agregar Testers

1. En TestFlight, ve a "Internal Testing" o "External Testing"
2. Agrega testers:
   - **Internal**: Hasta 100 testers (miembros del equipo)
   - **External**: Hasta 10,000 testers (requiere revisión de Apple)

3. Para cada grupo de testing:
   - Selecciona el build
   - Agrega información de testing (opcional)
   - Envía invitaciones

---

## 📋 Checklist Pre-Build

Antes de hacer el build, verifica:

- [ ] App creada en App Store Connect
- [ ] Bundle ID coincide (`com.sayhihodl.hihodlyes`)
- [ ] IDs obtenidos (ascAppId, appleTeamId, appleId)
- [ ] `eas.json` actualizado con los IDs
- [ ] URLs legales verificadas ✅
- [ ] Todas las variables de entorno configuradas en EAS ✅
- [ ] Versión en `app.json` es correcta (`1.0.0`)
- [ ] Build number se incrementará automáticamente (`autoIncrement: true`)

---

## 📋 Checklist Post-Build

Después del build:

- [ ] Build completado exitosamente
- [ ] Build aparece en App Store Connect (TestFlight)
- [ ] Build procesado por Apple (puede tomar 5-15 minutos)
- [ ] Screenshots subidos (opcional pero recomendado)
- [ ] Testers agregados
- [ ] Invitaciones enviadas

---

## 🔧 Troubleshooting

### Build falla

1. **Ver logs:**
   ```bash
   eas build:view [build-id]
   ```

2. **Errores comunes:**
   - Variables de entorno faltantes → Configurar en EAS
   - Certificados expirados → EAS los renueva automáticamente
   - Bundle ID incorrecto → Verificar en app.json y App Store Connect

### Build no aparece en TestFlight

1. Espera 5-15 minutos (procesamiento de Apple)
2. Verifica que el build fue exitoso
3. Verifica que el Bundle ID coincide
4. Revisa el email de App Store Connect por notificaciones

### No puedo agregar testers

1. **Internal Testing**: Solo miembros del equipo
2. **External Testing**: Requiere que el build pase revisión básica de Apple
3. Verifica que el build esté "Ready to Submit"

---

## 📱 Próximos Pasos Después de TestFlight

Una vez que TestFlight esté funcionando:

1. **Testing exhaustivo** con testers
2. **Recopilar feedback**
3. **Corregir bugs encontrados**
4. **Preparar para App Store:**
   - Screenshots profesionales
   - Descripción completa
   - Keywords optimizados
   - Categorías seleccionadas
   - Age Rating completado
   - Privacy Policy URL verificada
   - Support URL creada

---

## 🎯 Comandos Útiles

```bash
# Ver builds recientes
eas build:list

# Ver detalles de un build
eas build:view [build-id]

# Ver secrets configurados
eas secret:list

# Hacer build para TestFlight
./scripts/build-testflight.sh

# Subir a TestFlight automáticamente
eas submit --platform ios --profile testflight

# Ver estado de submission
eas submit:list
```

---

## 📞 Recursos

- **EAS Dashboard**: https://expo.dev/accounts/sayhihodl/projects/hihodl-yes/builds
- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer Portal**: https://developer.apple.com/account
- **Documentación EAS**: https://docs.expo.dev/build/introduction/

---

**Última actualización:** Ahora mismo  
**Estado:** Listo para configurar App Store Connect y hacer build



