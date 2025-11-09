# 🚀 Guía Completa para Lanzar HIHODL

## 📋 Checklist Rápido

- [ ] 1. Generar Android Keystore
- [ ] 2. Configurar EAS Secrets
- [ ] 3. Verificar URLs Legales
- [ ] 4. Build de Producción
- [ ] 5. Testing en Dispositivos Físicos
- [ ] 6. Preparar Screenshots
- [ ] 7. Completar Store Listings
- [ ] 8. Submitir a Stores

---

## Paso 1: Generar Android Keystore (5 min)

```bash
# Opción 1: Usar el script automatizado
./scripts/generate-android-keystore.sh

# Opción 2: Manual
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias hihodl-release \
  -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANTE:**
- Guarda las contraseñas en un lugar SEGURO
- Haz backup del keystore
- NUNCA lo commitees al repositorio

**Después de generar:**
```bash
# Configurar en EAS
eas credentials
# → Seleccionar Android → Production keystore → Upload
```

---

## Paso 2: Configurar EAS Secrets (15 min)

```bash
# Opción 1: Usar el script automatizado (recomendado)
./scripts/setup-eas-secrets.sh

# Opción 2: Manual (una por una)
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "tu-valor"
# ... (repetir para cada variable)
```

**Verificar que se configuraron:**
```bash
eas secret:list
```

**Variables necesarias:**
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
- `EXPO_PUBLIC_ALCHEMY_API_KEY`
- `EXPO_PUBLIC_HELIUS_API_KEY`
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_PRIVY_APP_ID` (si usas Privy)
- `EXPO_PUBLIC_PRIVY_CLIENT_ID` (si usas Privy)

---

## Paso 3: Verificar URLs Legales (10 min)

```bash
# Verificar que las URLs existen
./scripts/check-legal-urls.sh
```

**URLs requeridas:**
- Privacy Policy: `https://hihodl.xyz/privacy`
- Terms of Service: `https://hihodl.xyz/terms`

**Si no existen:**
1. Crearlas en tu sitio web
2. Asegurarse de que están actualizadas
3. Verificar que son accesibles públicamente

---

## Paso 4: Build de Producción (30-60 min)

```bash
# Opción 1: Usar el script automatizado
./scripts/build-production.sh android    # Solo Android
./scripts/build-production.sh ios        # Solo iOS
./scripts/build-production.sh both       # Ambos

# Opción 2: Manual
eas build --platform android --profile production
eas build --platform ios --profile production
```

**Ver builds:**
```bash
eas build:list
```

**Descargar build:**
- Ve a: https://expo.dev/accounts/[tu-account]/projects/hihodl-yes/builds
- Descarga el AAB (Android) o IPA (iOS)

---

## Paso 5: Testing en Dispositivos Físicos (1-2 horas)

### Android

1. **Instalar en dispositivo:**
   ```bash
   # Opción 1: Descargar AAB y convertir a APK para testing
   # Usa bundletool de Google o instala directamente desde EAS
   
   # Opción 2: Build de desarrollo para testing rápido
   eas build --platform android --profile development
   ```

2. **Probar:**
   - [ ] App se abre correctamente
   - [ ] Onboarding funciona
   - [ ] Google Sign In funciona
   - [ ] Todas las features principales funcionan
   - [ ] No hay crashes
   - [ ] Performance es aceptable

### iOS

1. **Instalar en dispositivo:**
   ```bash
   # Build de desarrollo para testing
   eas build --platform ios --profile development
   ```

2. **Probar:**
   - [ ] App se abre correctamente
   - [ ] Onboarding funciona
   - [ ] Google Sign In funciona
   - [ ] Apple Sign In funciona (si tienes certificados)
   - [ ] Todas las features principales funcionan
   - [ ] No hay crashes
   - [ ] Performance es aceptable

---

## Paso 6: Preparar Screenshots (1-2 horas)

### Google Play Store

**Requisitos:**
- Mínimo 2 screenshots, máximo 8
- Teléfono: 16:9 o 9:16, mínimo 320px
- Feature graphic: 1024 x 500px

**Pasos:**
1. Tomar screenshots en dispositivo físico o emulador
2. Editar para que se vean profesionales
3. Guardar en formato PNG o JPEG
4. Optimizar tamaño (no más de 8MB por imagen)

### App Store (iOS)

**Requisitos:**
- iPhone 6.7" (1290 x 2796px) - REQUERIDO
- iPhone 6.5" (1284 x 2778px) - REQUERIDO
- iPhone 5.5" (1242 x 2208px) - Opcional
- iPad (si soporta iPad)

**Pasos:**
1. Usar simulador de iOS para capturas
2. O usar dispositivo físico con herramientas de captura
3. Editar para que se vean profesionales
4. Guardar en formato PNG

**Herramientas útiles:**
- Simulador de iOS (Xcode)
- Android Studio Emulator
- Fastlane Screengrab (automatización)

---

## Paso 7: Completar Store Listings (2-3 horas)

### Google Play Store

**En Google Play Console:**

1. **Store Listing:**
   - [ ] Nombre corto (30 caracteres)
   - [ ] Descripción completa (4000 caracteres)
   - [ ] Descripción corta (80 caracteres)
   - [ ] Screenshots (mínimo 2)
   - [ ] Feature graphic (1024 x 500px)
   - [ ] Icono (512 x 512px)

2. **Content Rating:**
   - [ ] Completar cuestionario
   - [ ] Obtener rating (PEGI, ESRB, etc.)

3. **Data Safety:**
   - [ ] Completar formulario
   - [ ] Declarar qué datos se recopilan
   - [ ] Declarar cómo se usan los datos

4. **Privacy Policy:**
   - [ ] URL: `https://hihodl.xyz/privacy`

### App Store Connect

**En App Store Connect:**

1. **App Information:**
   - [ ] Nombre (30 caracteres)
   - [ ] Subtítulo (30 caracteres)
   - [ ] Descripción (4000 caracteres)
   - [ ] Keywords (100 caracteres)
   - [ ] Categoría primaria
   - [ ] Categoría secundaria (opcional)

2. **Screenshots:**
   - [ ] iPhone 6.7" (1290 x 2796px)
   - [ ] iPhone 6.5" (1284 x 2778px)

3. **Privacy Policy:**
   - [ ] URL: `https://hihodl.xyz/privacy`

4. **Support URL:**
   - [ ] URL de soporte (obligatorio)

5. **Age Rating:**
   - [ ] Completar cuestionario

---

## Paso 8: Submitir a Stores

### Google Play Store

```bash
# Submitir build a Play Store
eas submit --platform android --profile production
```

**O manualmente:**
1. Ir a Google Play Console
2. Seleccionar tu app
3. Ir a "Production" → "Create new release"
4. Subir el AAB descargado de EAS
5. Completar release notes
6. Submitir para review

**Tiempo de review:** 1-3 días

### App Store

```bash
# Submitir build a App Store
eas submit --platform ios --profile production
```

**O manualmente:**
1. Ir a App Store Connect
2. Seleccionar tu app
3. Ir a "TestFlight" o "App Store"
4. Subir el IPA descargado de EAS
5. Completar información de export compliance
6. Submitir para review

**Tiempo de review:** 1-7 días

---

## 🔧 Comandos Útiles

```bash
# Ver estado de builds
eas build:list

# Ver logs de un build
eas build:view [build-id]

# Ver credenciales configuradas
eas credentials

# Ver secrets configurados
eas secret:list

# Actualizar secret
eas secret:update --name EXPO_PUBLIC_XXX --value "nuevo-valor"

# Eliminar secret
eas secret:delete --name EXPO_PUBLIC_XXX
```

---

## ⚠️ Checklist Final Pre-Submit

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

## 🆘 Troubleshooting

### Error: "No secrets found"
```bash
# Verificar que estás logueado
eas whoami

# Configurar secrets
./scripts/setup-eas-secrets.sh
```

### Error: "Keystore not found"
```bash
# Generar keystore
./scripts/generate-android-keystore.sh

# Configurar en EAS
eas credentials
```

### Error: "Build failed"
```bash
# Ver logs del build
eas build:view [build-id]

# Verificar que todas las variables están configuradas
eas secret:list
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `eas build:view [build-id]`
2. Verifica la documentación de EAS: https://docs.expo.dev/build/introduction/
3. Revisa los checklists en el proyecto

---

**Última actualización:** Basado en el estado actual del proyecto

