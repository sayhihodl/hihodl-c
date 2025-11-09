# ✅ Integración de Analytics Completada

## 📊 Eventos Trackeados

### 1. **Eventos de Usuario**
- ✅ `app_opened` - Cuando la app se abre
- ✅ `user_login` - Login exitoso (Google/Apple)
- ✅ `login_failed` - Login fallido con error
- ✅ `onboarding_completed` - Onboarding completado

### 2. **Eventos de Pagos**
- ✅ `payment_sent` - Pago enviado exitosamente
  - Parámetros: `amount`, `currency` (token), `recipient`
- ✅ `payment_received` - Pago recibido
  - Parámetros: `amount`, `currency` (token), `sender`
- ✅ `payment_send_failed` - Error al enviar pago
  - Parámetros: `token`, `amount`, `error`

### 3. **Eventos de Swap**
- ✅ `token_swapped` - Swap completado exitosamente
  - Parámetros: `from_token`, `to_token`, `amount`

### 4. **Vistas de Pantalla (Screen Views)**
- ✅ `Home` - Pantalla principal del dashboard
- ✅ `Swap` - Pantalla de intercambio de tokens

## 🔧 Archivos Modificados

### Inicialización
- `app/_layout.tsx` - Inicializa analytics y trackea `app_opened`

### Autenticación
- `src/auth/social.ts` - Trackea login/logout (Google y Apple)
- `src/store/session.ts` - Establece user ID cuando se crea sesión

### Pagos
- `src/payments/PaymentComposer.tsx` - Trackea pagos enviados
- `app/(drawer)/(internal)/payments/QuickSendScreen.tsx` - Trackea pagos desde QuickSend
- `src/lib/notifications.ts` - Trackea pagos recibidos

### Swap
- `app/(drawer)/(tabs)/swap/index.tsx` - Trackea swaps completados y vista de pantalla

### Onboarding
- `app/onboarding/success.tsx` - Trackea onboarding completado

### Pantallas
- `app/(drawer)/(tabs)/(home)/index.tsx` - Trackea vista de pantalla Home

## 🚀 Cómo Activar Firebase Analytics

Para activar Firebase Analytics (recomendado para mobile), simplemente descomenta esta línea en `app/_layout.tsx`:

```typescript
import "@/utils/analytics-firebase";
```

Esto automáticamente enviará todos los eventos a Firebase Analytics además de Google Analytics (si está configurado).

## 📈 Próximos Pasos

### Eventos Adicionales Recomendados
1. **Onboarding steps**: Trackear cada paso completado
   ```typescript
   analytics.trackOnboardingStep("username");
   analytics.trackOnboardingStep("password");
   ```

2. **Wallet creation**: Cuando se crea wallet por primera vez
   ```typescript
   analytics.trackEvent({ 
     name: "wallet_created",
     parameters: { method: "social" | "email" }
   });
   ```

3. **Feature discovery**: Cuando usuario descubre features
   ```typescript
   analytics.trackEvent({ 
     name: "feature_discovered",
     parameters: { feature: "swap", source: "home" }
   });
   ```

4. **Errors críticos**: Ya tienes logger, pero puedes trackear errores críticos
   ```typescript
   analytics.trackEvent({
     name: "critical_error",
     parameters: { error: error.message, context: "payment" }
   });
   ```

## 🔍 Ver Eventos

- **Firebase Analytics**: [Firebase Console](https://console.firebase.google.com) > Analytics > Events
- **Google Analytics**: [Google Analytics](https://analytics.google.com) > Events

## ⚠️ Notas de Privacidad

- ✅ NO se trackea información sensible (passwords, seeds, private keys)
- ✅ Solo se trackea wallet address como user ID (público)
- ✅ Los eventos de pago no incluyen direcciones completas, solo alias/display names
- ⚠️ Considera agregar consentimiento para usuarios en EU/CA (GDPR/CCPA)

