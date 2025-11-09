# 🔧 Configurar Native App ID en Privy Dashboard

## ❌ Error Actual

```
Error: Native app ID host.exp.Exponent has not been set as an allowed app identifier 
in the Privy dashboard.
```

## ✅ Solución

Necesitas configurar los **Native App IDs** en el Privy Dashboard.

### Bundle Identifiers de tu App

- **iOS (Desarrollo)**: `host.exp.Exponent` (Expo Go)
- **iOS (Producción)**: `com.sayhihodl.hihodlyes`
- **Android (Desarrollo)**: `host.exp.Exponent` (Expo Go)
- **Android (Producción)**: `com.sayhihodl.hihodlyes`

### Pasos para Configurar (Basado en tu Dashboard)

1. **Estás en la ubicación correcta:**
   - ✅ Settings → Clients tab
   - ✅ Card: "Default mobile app client"

2. **Hacer clic en "Edit"** (botón en la esquina superior derecha del card)

3. **En el formulario de edición, agregar:**

   **App identifiers:**
   - `com.sayhihodl.hihodlyes` (iOS y Android - producción)
   - `host.exp.Exponent` (iOS y Android - desarrollo con Expo Go)
   
   **URL schemes:**
   - `hihodl` (el scheme de tu app, ya configurado en app.json)

4. **Guardar los cambios**

### Valores Exactos a Agregar

**App Identifiers (agregar todos):**
```
com.sayhihodl.hihodlyes
host.exp.Exponent
```

**URL Schemes:**
```
hihodl
```

### Ubicación Alternativa

Si no encuentras "Clientes", busca en:
- **Settings** → **App Configuration**
- **Settings** → **Mobile App Settings**
- **Settings** → **Allowed App Identifiers**
- **Security** → **App Identifiers**

### Nota Importante

- `host.exp.Exponent` es el bundle ID que usa Expo Go en desarrollo
- En producción (cuando hagas build), usarás `com.sayhihodl.hihodlyes`
- Puedes agregar ambos para que funcione en desarrollo y producción
- **Es importante**: Si la lista de identificadores está vacía, todas las solicitudes desde aplicaciones móviles serán rechazadas

### Si No Encuentras la Sección

Si aún no encuentras dónde configurar esto:
1. Verifica que estés en la app correcta: `cmhqg199a000tl70ca9h3i1pu`
2. Busca en el menú lateral: **Settings**, **Configuration**, o **Security**
3. Puede estar en una pestaña dentro de Settings llamada **"Mobile"** o **"Native Apps"**
4. Contacta al soporte de Privy si no encuentras la opción

### Verificación

Después de configurar, reinicia la app:

```bash
npx expo start -c
```

El error debería desaparecer y verás:
- ✅ Privy App ID loaded
- ✅ Privy Client ID loaded
- ✅ Sin errores de "Native app ID"

---

## Referencias

- [Privy Dashboard](https://dashboard.privy.io/)
- [Privy Docs - App Configuration](https://docs.privy.io/)

