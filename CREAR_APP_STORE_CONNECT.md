# 📱 Crear App en App Store Connect

## ✅ Información Pre-llenada (Correcta)

- **Platforms**: iOS ✅ (marcado)
- **Name**: `HIHODL` ✅
- **Primary Language**: English (U.S.) ✅
- **Bundle ID**: `com.sayhihodl.hihodlyes` ✅ (aparece como "HIHODL iOS App - com.sayhihodl.hihodlyes")
- **User Access**: Full Access ✅ (seleccionado)

---

## ⚠️ Campo Requerido: SKU

**SKU** (Stock Keeping Unit) es un identificador único para tu app.

### Opciones para SKU:

**Opción 1: Simple (Recomendado)**
```
hihodl-ios-001
```

**Opción 2: Con Bundle ID**
```
com.sayhihodl.hihodlyes.ios
```

**Opción 3: Con fecha**
```
hihodl-ios-2024
```

**Recomendación:** Usa `hihodl-ios-001`
- Es único
- Fácil de recordar
- Puedes usar `hihodl-ios-002` para futuras versiones si necesitas

---

## 📋 Pasos para Completar

1. **SKU**: Escribe `hihodl-ios-001` en el campo (el que tiene borde rojo)
2. Verifica que todo esté correcto:
   - ✅ iOS marcado
   - ✅ Name: `HIHODL`
   - ✅ Bundle ID: `com.sayhihodl.hihodlyes`
   - ✅ SKU: `hihodl-ios-001`
   - ✅ Full Access seleccionado
3. Haz clic en **"Create"** (se activará cuando completes el SKU)

---

## ⚠️ Notas Importantes

### SKU:
- **Debe ser único** en tu cuenta de App Store Connect
- **No puede cambiarse** después de crear la app
- **No es visible** para usuarios finales
- **Solo para uso interno** de Apple/desarrollador

### Bundle ID:
- Ya está seleccionado correctamente: `com.sayhihodl.hihodlyes`
- Debe coincidir con el App ID que registraste en Apple Developer Portal ✅

### User Access:
- **Full Access**: Todos los usuarios del equipo pueden ver y editar
- **Limited Access**: Solo ciertos usuarios pueden ver/editar (más seguro para equipos grandes)
- **Recomendación:** Full Access está bien para empezar

---

## ✅ Después de Crear la App

Una vez creada, verás:

1. **App Information** - Información básica de la app
2. **Pricing and Availability** - Precio y disponibilidad
3. **App Privacy** - Privacidad (necesitarás completar esto)
4. **TestFlight** - Para subir builds de prueba

---

## 🚀 Próximos Pasos Después de Crear

1. **Completar información básica:**
   - Privacy Policy URL: `https://hihodl.xyz/privacy` ✅
   - Support URL: `https://hihodl.xyz` (o crear `/support`)

2. **Obtener IDs para eas.json:**
   - **ascAppId**: En "App Information" → "Apple ID" (número)
   - **appleTeamId**: Ya lo tienes: `VLV25ZF66P`
   - **appleId**: Tu email de Apple Developer

3. **Hacer build para TestFlight:**
   ```bash
   ./scripts/build-testflight.sh
   ```

---

**Completa el SKU y haz clic en "Create"** 🚀



