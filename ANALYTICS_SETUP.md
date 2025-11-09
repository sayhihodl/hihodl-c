# Configuración de Analytics

## 📊 Sistema de Analytics Implementado

Hemos creado un sistema de analytics centralizado que permite trackear eventos de usuario y enviarlos a diferentes servicios:

- ✅ **Supabase Postgres** - Almacenamiento de eventos en base de datos (todas las plataformas)
- ✅ **Mixpanel** - Analytics avanzado de eventos (web, iOS y Android) ⭐ **Recomendado para apps móviles**
- ✅ **Google Analytics** - Analytics web (solo web)
- ✅ **Contentsquare** - Mapas de calor y análisis de UX (web implementado, SDK móvil disponible)
- ✅ **Firebase Analytics** - Analytics de Google para móviles (disponible, requiere configuración)
- ✅ **Logger** - Desarrollo y debugging

## 📱 Para Apps Móviles (iOS/Android)

**Opciones disponibles:**

1. **Mixpanel** ✅ **YA IMPLEMENTADO** - La mejor opción para apps móviles
   - Tracking de eventos avanzado
   - Análisis de embudos y retención
   - Funciona en iOS, Android y web

2. **Firebase Analytics** - Disponible pero requiere activación
   - Integración nativa con Firebase
   - Análisis de comportamiento de usuarios
   - Requiere `@react-native-firebase/analytics`

3. **Contentsquare Mobile SDK** - Disponible (no implementado aún)
   - Mapas de calor para móviles
   - Grabaciones de sesiones
   - Requiere SDK nativo de Contentsquare

**Nota:** Hotjar es solo para web, por eso no está incluido. Para funcionalidades similares en móviles, considera Contentsquare Mobile SDK o UXCam.

## 🚀 Uso Básico

### 1. Inicializar Analytics (al inicio de la app)

En `app/_layout.tsx` o donde inicialices la app:

```typescript
import { analytics } from "@/utils/analytics";

// Al iniciar la app
// El token de Mixpanel se lee automáticamente de EXPO_PUBLIC_MIXPANEL_TOKEN
analytics.init(true); // true para habilitar, false para deshabilitar

// O pasar el token manualmente:
analytics.init(true, "tu-mixpanel-token");
```

### 2. Identificar Usuario (cuando hace login)

```typescript
import { analytics } from "@/utils/analytics";

// Cuando el usuario inicia sesión
analytics.setUserId(user.id);

// Opcional: propiedades del usuario
analytics.setUserProperties({
  plan: "premium",
  country: "US",
  account_type: "daily",
});
```

### 3. Trackear Eventos

```typescript
import { analytics } from "@/utils/analytics";

// Evento personalizado
analytics.trackEvent({
  name: "button_clicked",
  parameters: {
    button_name: "send_payment",
    screen: "home",
  },
});

// Eventos predefinidos
analytics.trackPaymentSent({ amount: 100, token: "USDC", to: "@maria" });
analytics.trackPaymentReceived({ amount: 50, token: "SOL", from: "@juan" });
analytics.trackTokenSwapped({ from: "USDC", to: "SOL", amount: 100 });
analytics.trackLogin("google");
analytics.trackSignup("apple");
analytics.trackOnboardingStep("create_wallet");
```

### 4. Trackear Vistas de Pantalla

```typescript
// En componentes de pantalla
useEffect(() => {
  analytics.trackScreenView({
    screen_name: "Home",
    screen_class: "Dashboard",
  });
}, []);
```

## 🔧 Configurar Google Analytics (Web)

### Opción 1: Google Analytics 4 (gtag.js)

1. Agrega el script en `app/_layout.tsx` o en `index.html`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

2. El sistema de analytics ya detectará `gtag` automáticamente.

### Opción 2: React Native (para apps nativas)

Para React Native, usa `@react-native-google-analytics/google-analytics` o `react-native-firebase`:

```bash
npm install @react-native-firebase/analytics
```

Luego actualiza `analytics.ts` para usar Firebase Analytics en mobile.

## 📊 Configurar Mixpanel

Mixpanel es una plataforma de analytics avanzada que permite analizar eventos, crear embudos, y hacer análisis de retención.

### ✅ Mixpanel ya está configurado

**Token del proyecto:** `2e63cb0ef9ad3b8419a852941c60ff7e`

El token ya está configurado por defecto en el código. Si quieres usar un token diferente, puedes configurarlo con una variable de entorno.

### Configuración Actual

**Para Web:**
- ✅ **Autocapture**: Activado - Captura automáticamente clicks, form submissions, etc.
- ✅ **Session Replay**: Activado al 100% - Graba todas las sesiones de usuario
- ✅ **API Host**: EU region (`https://api-eu.mixpanel.com`)
- ✅ **Persistence**: localStorage para mantener datos entre sesiones

**Para Móviles (iOS/Android):**
- ✅ Tracking de eventos manual y automático
- ✅ User identification y properties

### Opcional: Usar un Token Diferente

Si necesitas usar un token diferente, configura la variable de entorno:

**Opción A: Archivo `.env` (desarrollo local)**

```env
EXPO_PUBLIC_MIXPANEL_TOKEN=tu-nuevo-token-aqui
```

**Opción B: EAS Secrets (producción)**

```bash
eas secret:create --scope project --name EXPO_PUBLIC_MIXPANEL_TOKEN --value "tu-nuevo-token"
```

### Verificar Inicialización

El sistema automáticamente inicializará Mixpanel cuando la app se inicie. Verás en la consola:

```
✅ Mixpanel configurado
[Analytics] Mixpanel initialized { token: '2e63cb0e...', platform: 'web' }
```

### Características de Mixpanel

- ✅ **Tracking automático**: Todos los eventos se envían automáticamente a Mixpanel
- ✅ **Autocapture (web)**: Captura automática de interacciones del usuario
- ✅ **Session Replay (web)**: Grabación de sesiones para análisis de UX
- ✅ **User identification**: Se identifica automáticamente cuando llamas `analytics.setUserId()`
- ✅ **User properties**: Se sincronizan con `analytics.setUserProperties()`
- ✅ **Multiplataforma**: Funciona en web, iOS y Android
- ✅ **EU Region**: Datos almacenados en servidores de la UE

## 📊 Configurar Contentsquare (Solo Web)

Contentsquare es una plataforma de análisis de experiencia de usuario que proporciona mapas de calor, grabaciones de sesiones y análisis de comportamiento.

### Paso 1: Obtener Site ID de Contentsquare

1. Crea una cuenta en [Contentsquare](https://www.contentsquare.com/)
2. Crea un nuevo proyecto/sitio
3. Obtén tu **Site ID** (ej: `8dd547cc125f2`)

### Paso 2: Configurar Variable de Entorno

**Opción A: Archivo `.env` (desarrollo local)**

```env
EXPO_PUBLIC_CONTENTSQUARE_SITE_ID=8dd547cc125f2
```

**Opción B: EAS Secrets (producción)**

```bash
eas secret:create --scope project --name EXPO_PUBLIC_CONTENTSQUARE_SITE_ID --value "8dd547cc125f2"
```

### Paso 3: Verificar Inicialización

Contentsquare se inicializa automáticamente solo en web. El script se inyecta en el `<head>` de la página. Verás en la consola:

```
✅ Contentsquare configurado
```

**Nota:** La implementación actual de Contentsquare es solo para web. Contentsquare también ofrece SDKs móviles nativos para iOS y Android que proporcionan funcionalidades similares (mapas de calor, grabaciones) en apps móviles. Si necesitas Contentsquare en móviles, necesitarías instalar el SDK nativo de Contentsquare.

## 🔥 Configurar Firebase Analytics para Móviles (Opcional)

Firebase Analytics es una excelente opción para apps móviles iOS y Android. Proporciona análisis detallados de comportamiento de usuarios.

### Paso 1: Instalar Firebase Analytics

```bash
npm install @react-native-firebase/analytics
```

### Paso 2: Configurar Firebase

Ya tienes Firebase configurado en tu proyecto. Para activar Analytics:

1. Asegúrate de que `google-services.json` (Android) y `GoogleService-Info.plist` (iOS) estén configurados
2. Importa y usa Firebase Analytics en tu código

### Paso 3: Integrar con el Sistema de Analytics

Puedes crear un wrapper similar a `analytics-firebase.ts` o integrarlo directamente en `analytics.ts`.

**Ejemplo de integración:**

```typescript
// En src/utils/analytics.ts o crear analytics-firebase.ts
import analytics from '@react-native-firebase/analytics';

// En el método trackEvent:
if (Platform.OS !== 'web') {
  await analytics().logEvent(event.name, event.parameters);
}
```

**Nota:** Firebase Analytics funciona mejor en apps nativas. Para web, usa Google Analytics (gtag) que ya está soportado.

## 📝 Ejemplos de Integración en la App

### Trackear cuando se envía un pago

```typescript
// En PaymentComposer.tsx o donde se complete un pago
import { analytics } from "@/utils/analytics";

const handleSend = async () => {
  // ... lógica de envío
  
  analytics.trackPaymentSent({
    amount: Number(amount),
    token: tokenSymbol,
    to: peerAlias,
  });
};
```

### Trackear pasos de onboarding

```typescript
// En cada pantalla de onboarding
import { analytics } from "@/utils/analytics";

useEffect(() => {
  analytics.trackOnboardingStep("username"); // o "password", "backup", etc.
}, []);
```

### Trackear cuando usuario hace login

```typescript
// En auth/login.tsx
import { analytics } from "@/utils/analytics";

const handleLogin = async (provider: "google" | "apple") => {
  // ... lógica de login
  
  analytics.trackLogin(provider);
  analytics.setUserId(user.id);
};
```

## 🔒 Privacidad y Opt-Out

Para permitir que usuarios deshabiliten analytics:

```typescript
import { analytics } from "@/utils/analytics";

// En configuración de usuario
const handleOptOut = () => {
  analytics.disable();
  // Guardar preferencia del usuario
};

const handleOptIn = () => {
  analytics.enable();
  // Guardar preferencia del usuario
};
```

## 🎯 Eventos Recomendados para Trackear

### Eventos de Negocio (Conversión)
- `payment_sent` - Cuando usuario envía dinero
- `payment_received` - Cuando usuario recibe dinero
- `token_swapped` - Cuando usuario hace swap
- `wallet_created` - Cuando usuario crea wallet
- `onboarding_completed` - Cuando termina onboarding

### Eventos de UX (Engagement)
- `screen_view` - Cada vez que cambia de pantalla
- `button_clicked` - Botones importantes (puede ser demasiado granular)
- `feature_discovered` - Cuando descubre una feature nueva
- `error_occurred` - Errores críticos (ya lo tienes con logger)

### Eventos de Retención
- `app_opened` - Al abrir la app
- `daily_active` - Usuario activo en el día
- `session_started` - Inicio de sesión

## 📊 Ver Eventos en los Dashboards

Una vez configurado, puedes ver los eventos en:

### Para Apps Móviles (iOS/Android):
- **Mixpanel**: Ve a [Mixpanel Dashboard](https://mixpanel.com/) > Events ⭐ **Recomendado**
- **Firebase Analytics**: Ve a [Firebase Console](https://console.firebase.google.com) > Analytics
- **Supabase Postgres**: Consulta la tabla `analytics_events` en tu base de datos

### Para Web:
- **Mixpanel**: Ve a [Mixpanel Dashboard](https://mixpanel.com/) > Events
- **Google Analytics**: Ve a [Google Analytics](https://analytics.google.com) > Events
- **Contentsquare**: Ve a [Contentsquare Dashboard](https://app.contentsquare.com/) > Analytics
- **Supabase Postgres**: Consulta la tabla `analytics_events` en tu base de datos

## ⚠️ Notas Importantes

1. **No trackear información sensible**: No envíes contraseñas, seeds, o datos financieros sensibles
2. **Cumplir GDPR/CCPA**: Si tienes usuarios en EU/CA, implementa consentimiento
3. **Performance**: Analytics es asíncrono y no debería bloquear la UI
4. **Debug**: En desarrollo, los eventos se logean en consola para debugging
5. **Mixpanel**: Funciona en todas las plataformas (web, iOS, Android) - **⭐ Recomendado para apps móviles**
6. **Firebase Analytics**: Funciona en iOS y Android - Requiere `@react-native-firebase/analytics`
7. **Google Analytics**: Solo funciona si compilas la versión web de Expo
8. **Contentsquare Web**: Solo funciona si compilas la versión web de Expo (mapas de calor y grabaciones)
9. **Contentsquare Mobile**: Disponible pero requiere SDK nativo (no implementado)
10. **Hotjar**: Solo web - No disponible para apps móviles
11. **Variables de entorno**: Todas las configuraciones usan el prefijo `EXPO_PUBLIC_` para que estén disponibles en el cliente

## 🔧 Resumen de Variables de Entorno

```env
# Supabase (requerido para almacenar eventos)
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mixpanel (opcional, recomendado para apps móviles)
EXPO_PUBLIC_MIXPANEL_TOKEN=tu-mixpanel-project-token

# Contentsquare (opcional, solo web)
EXPO_PUBLIC_CONTENTSQUARE_SITE_ID=8dd547cc125f2
```

