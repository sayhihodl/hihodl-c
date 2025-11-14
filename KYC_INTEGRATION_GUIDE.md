# 🔐 Guía de Integración KYC con Stripe Identity

Esta guía explica cómo configurar y usar el sistema de verificación KYC (Know Your Customer) usando Stripe Identity para pagos PIX y Mercado Pago.

---

## 📋 Resumen

**Problema:** PIX y Mercado Pago requieren verificación de identidad (KYC) según regulaciones brasileñas/argentinas.

**Solución:** Integración con **Stripe Identity** que:
- ✅ No almacena documentos en tu servidor
- ✅ Stripe maneja todo el proceso de verificación
- ✅ Cumple con regulaciones locales
- ✅ Fácil de integrar

---

## 🏗️ Arquitectura

```
Usuario intenta pagar PIX/Mercado Pago
    ↓
Frontend verifica estado KYC
    ↓
Si NO verificado → Muestra modal de verificación
    ↓
Backend crea Stripe VerificationSession
    ↓
Frontend abre WebView con URL de Stripe
    ↓
Usuario completa verificación en Stripe
    ↓
Stripe envía webhook al backend
    ↓
Backend actualiza estado KYC del usuario
    ↓
Usuario puede realizar pagos
```

---

## 🔧 Configuración del Backend

### 1. Instalar Stripe SDK

```bash
npm install stripe
```

### 2. Configurar Variables de Entorno

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Implementar Endpoints

Necesitas crear estos endpoints en tu backend:

#### `POST /api/v1/kyc/create-verification`

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createKYCVerification(req, res) {
  const userId = req.user.id; // De tu autenticación
  
  try {
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: 'document',
      metadata: {
        user_id: userId,
      },
      return_url: `${process.env.APP_URL}/kyc/complete`, // URL de retorno
    });

    res.json({
      success: true,
      data: {
        verificationSessionId: verificationSession.id,
        clientSecret: verificationSession.client_secret,
        url: verificationSession.url, // URL para abrir en WebView
        expiresAt: verificationSession.expires_at * 1000, // Convertir a ms
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
}
```

#### `GET /api/v1/kyc/status/:verificationSessionId`

```typescript
export async function getKYCStatus(req, res) {
  const { verificationSessionId } = req.params;
  
  try {
    const session = await stripe.identity.verificationSessions.retrieve(
      verificationSessionId
    );

    // Actualizar estado en tu base de datos
    await updateUserKYCStatus(req.user.id, {
      status: session.status,
      verifiedAt: session.verified_at ? session.verified_at * 1000 : undefined,
    });

    res.json({
      success: true,
      data: {
        status: session.status, // 'pending' | 'verified' | 'failed' | 'expired'
        verifiedAt: session.verified_at ? session.verified_at * 1000 : undefined,
        expiresAt: session.expires_at ? session.expires_at * 1000 : undefined,
        error: session.last_error?.message,
        verifiedData: session.verified_outputs ? {
          fullName: session.verified_outputs.dob?.full_name,
          country: session.verified_outputs.address?.country,
          documentType: session.type,
        } : undefined,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
}
```

#### `GET /api/v1/kyc/user-status`

```typescript
export async function getUserKYCStatus(req, res) {
  const userId = req.user.id;
  
  try {
    // Obtener estado de tu base de datos
    const kycStatus = await getUserKYCStatusFromDB(userId);

    res.json({
      success: true,
      data: {
        isVerified: kycStatus?.status === 'verified',
        status: kycStatus?.status || 'not_started',
        verifiedAt: kycStatus?.verifiedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message },
    });
  }
}
```

### 4. Configurar Webhook de Stripe

Stripe enviará eventos cuando se complete una verificación:

```typescript
// POST /api/v1/webhooks/stripe
export async function stripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manejar evento de verificación completada
  if (event.type === 'identity.verification_session.verified') {
    const session = event.data.object;
    const userId = session.metadata.user_id;

    // Actualizar estado en tu base de datos
    await updateUserKYCStatus(userId, {
      status: 'verified',
      verifiedAt: Date.now(),
    });
  }

  res.json({ received: true });
}
```

---

## 📱 Configuración del Frontend

### 1. Variables de Entorno

No necesitas configurar nada adicional en el frontend. Todo se maneja a través del backend.

### 2. Uso en el Código

El sistema ya está integrado en `QuickSendScreen.tsx`. Cuando un usuario intenta pagar PIX o Mercado Pago:

1. Se verifica el estado KYC automáticamente
2. Si no está verificado, se muestra el modal de verificación
3. El usuario completa el proceso en Stripe
4. Una vez verificado, puede realizar pagos

---

## 🧪 Testing

### Modo Test de Stripe

Stripe tiene documentos de prueba para verificación:

1. **Documento válido:** Usa cualquier documento de identidad válido
2. **Selfie:** Toma una selfie con tu cámara
3. **Resultado:** Stripe verificará y marcará como `verified`

### Flujo de Prueba

1. Intenta enviar un pago PIX
2. Debería aparecer el modal de verificación KYC
3. Completa el proceso en Stripe
4. Una vez verificado, intenta enviar el pago nuevamente
5. Debería funcionar correctamente

---

## 💰 Costos

**Stripe Identity Pricing:**
- **$1.50 por verificación** (una vez por usuario)
- Solo se cobra cuando el usuario completa la verificación
- No hay costos mensuales

**Alternativas más económicas:**
- **Onfido:** ~$1.00 por verificación
- **Jumio:** ~$1.20 por verificación
- **Veriff:** ~$0.80 por verificación

---

## 🔄 Alternativas a Stripe Identity

Si prefieres otro proveedor, puedes cambiar fácilmente:

### Onfido

```typescript
// Similar estructura, solo cambia el SDK
import { Onfido } from '@onfido/api';

const onfido = new Onfido({
  apiToken: process.env.ONFIDO_API_TOKEN!,
});
```

### Jumio

```typescript
// Similar estructura
import { JumioClient } from '@jumio/api';
```

---

## 📊 Base de Datos

Necesitas una tabla para almacenar el estado KYC:

```sql
CREATE TABLE user_kyc_status (
  user_id UUID PRIMARY KEY,
  status VARCHAR(20) NOT NULL, -- 'pending' | 'verified' | 'failed' | 'expired'
  verification_session_id VARCHAR(255),
  verified_at BIGINT,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
```

---

## ✅ Checklist de Implementación

### Backend
- [ ] Instalar Stripe SDK
- [ ] Configurar variables de entorno
- [ ] Implementar `POST /kyc/create-verification`
- [ ] Implementar `GET /kyc/status/:id`
- [ ] Implementar `GET /kyc/user-status`
- [ ] Configurar webhook de Stripe
- [ ] Crear tabla de base de datos para estado KYC

### Frontend
- [x] Servicio KYC creado (`src/services/api/kyc.service.ts`)
- [x] Componente de verificación creado (`src/components/KYCVerification.tsx`)
- [x] Hook de KYC creado (`src/hooks/useKYC.ts`)
- [x] Integrado en flujo de pagos PIX/Mercado Pago

### Testing
- [ ] Probar flujo completo de verificación
- [ ] Verificar que pagos funcionan después de KYC
- [ ] Probar casos de error (verificación fallida, expirada)

---

## 🚨 Notas Importantes

1. **Privacidad:** Stripe almacena los documentos, tú solo guardas el estado de verificación
2. **Cumplimiento:** Stripe cumple con GDPR, CCPA y regulaciones locales
3. **Seguridad:** Los documentos nunca pasan por tu servidor
4. **Costo:** Solo pagas cuando un usuario completa la verificación

---

## 📚 Recursos

- [Stripe Identity Documentation](https://stripe.com/docs/identity)
- [Stripe Identity API Reference](https://stripe.com/docs/api/identity/verification_sessions)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

---

## 🆘 Soporte

Si tienes problemas:
1. Verifica que las variables de entorno estén configuradas
2. Revisa los logs del backend para errores de Stripe
3. Verifica que el webhook esté configurado correctamente
4. Usa el modo test de Stripe para desarrollo



