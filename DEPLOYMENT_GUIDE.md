# 🚀 Guía de Deployment - HIHODL App

## 📋 Pre-requisitos

1. Cuenta de [EAS Build](https://expo.dev/)
2. Cuenta de [Apple Developer](https://developer.apple.com/) (para iOS)
3. Cuenta de [Google Play Console](https://play.google.com/console/) (para Android)
4. Todas las API keys y credenciales configuradas

## 🔐 Configuración de Variables de Entorno

### Opción 1: Usando EAS Secrets (Recomendado)

```bash
# Instalar EAS CLI si no lo tienes
npm install -g eas-cli

# Login a EAS
eas login

# Configurar secrets
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "tu-api-key"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "hihodl.xyz"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "hihodl"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "928131091332"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:928131091332:web:b2b41bde81247e25892bd1"

# Google OAuth
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "tu-web-client-id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "tu-ios-client-id"
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID --value "tu-android-client-id"

# Blockchain APIs
eas secret:create --scope project --name EXPO_PUBLIC_ALCHEMY_API_KEY --value "tu-alchemy-key"
eas secret:create --scope project --name EXPO_PUBLIC_HELIUS_API_KEY --value "tu-helius-key"

# Backend API
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.hihodl.xyz"
```

### Opción 2: Archivo .env (Solo para desarrollo local)

Crear `.env` en la raíz del proyecto (NO commitearlo):

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=tu-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=hihodl.xyz
# ... etc
```

Y usar `expo-constants` o similar para leer las variables.

## 🤖 Android - Configuración de Keystore

### 1. Generar Keystore de Producción

```bash
keytool -genkeypair -v -storetype PKCS12 -keystore release.keystore -alias hihodl-release -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANTE**: 
- Guardar el archivo `release.keystore` en lugar seguro
- Guardar passwords y alias en password manager
- Hacer backup en lugar seguro separado
- NO commitearlo al repositorio

### 2. Configurar en EAS

```bash
# Subir keystore a EAS (se encripta y almacena de forma segura)
eas credentials

# O configurar manualmente en eas.json build credentials
```

### 3. Verificar Configuración

El `build.gradle` ya está configurado para usar el keystore si está disponible. Para builds locales, configurar en `android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=../release.keystore
MYAPP_RELEASE_STORE_PASSWORD=tu-password
MYAPP_RELEASE_KEY_ALIAS=hihodl-release
MYAPP_RELEASE_KEY_PASSWORD=tu-key-password
```

## 🍎 iOS - Configuración

### 1. Apple Developer Portal

1. Crear App ID: `com.sayhihodl.hihodlyes`
2. Configurar Certificates & Profiles
3. Crear App Store Connect listing

### 2. Configurar EAS

```bash
eas credentials
# Seguir el wizard para configurar certificados iOS
```

### 3. Actualizar eas.json

Editar `eas.json` con tus datos reales:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "tu-apple-id@example.com",
        "ascAppId": "tu-app-id",
        "appleTeamId": "tu-team-id"
      }
    }
  }
}
```

## 🔨 Building

### Build de Preview (para testing interno)

```bash
# Android
eas build --platform android --profile preview

# iOS
eas build --platform ios --profile preview

# Ambos
eas build --platform all --profile preview
```

### Build de Producción

```bash
# Android (genera AAB para Play Store)
eas build --platform android --profile production

# iOS (genera IPA para App Store)
eas build --platform ios --profile production

# Ambos
eas build --platform all --profile production
```

## 📤 Submitting a Stores

### Google Play Store

1. **Primera vez**: Subir manualmente el primer AAB desde Play Console
2. **Automático con EAS**:
   ```bash
   eas submit --platform android --profile production
   ```
   
3. **Configurar servicio de cuenta**:
   - Crear Service Account en Google Cloud Console
   - Descargar JSON key
   - Configurar en `eas.json` o usar `eas credentials`

### App Store

1. **Primera vez**: Crear app en App Store Connect manualmente
2. **Automático con EAS**:
   ```bash
   eas submit --platform ios --profile production
   ```

3. **Actualizar eas.json** con tus credenciales de Apple

## 📝 Checklist Pre-Submit

Antes de submitir, verificar:

- [ ] Todas las variables de entorno están configuradas
- [ ] Keystore de producción está configurado (Android)
- [ ] Certificados iOS están configurados
- [ ] App funciona en device físico
- [ ] No hay errores en consola
- [ ] URLs legales están actualizadas y funcionan
- [ ] Analytics está activado
- [ ] Version number está incrementado
- [ ] Screenshots y descripciones listas en stores

## 🐛 Troubleshooting

### Error: "Keystore not found"
- Verificar que el keystore está configurado en EAS o gradle.properties
- Para EAS builds, usar `eas credentials` para configurar

### Error: "Missing environment variables"
- Verificar que todos los secrets están configurados en EAS
- Ver lista completa en `PRODUCCION_CHECKLIST.md`

### Error: "Bundle identifier already exists"
- El bundle ID ya está en uso
- Cambiar en `app.json` o liberar el bundle ID existente

## 📚 Recursos

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)
- [Android Signing Guide](https://reactnative.dev/docs/signed-apk-android)
- [iOS Distribution Guide](https://developer.apple.com/distribute/)

