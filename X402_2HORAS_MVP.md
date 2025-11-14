# ⚡ x402 MVP en 2 Horas - Plan Ultra-Rápido

## ¿Es posible en 2 horas?

**Respuesta:** **SÍ, pero MVP MÍNIMO funcional (demo, no producción)**

---

## ⏱️ BREAKDOWN DE 2 HORAS

### Hora 1: Backend x402 Básico

#### 30 min: Middleware x402
```typescript
// src/middleware/x402.ts
- Detectar solicitudes sin pago
- Retornar 402 con info de pago
- Verificar header X-Payment-Proof (básico)
```

#### 20 min: Endpoint de Verificación (Mock)
```typescript
// POST /payments/x402/verify
- Verificar formato de pago (mock, no on-chain aún)
- Retornar token de acceso
```

#### 10 min: Endpoint Protegido (Ejemplo)
```typescript
// GET /api/v1/ai/balance-aggregated
- Protegido con middleware x402
- Retorna datos agregados (mock por ahora)
```

**Total Hora 1:** Backend básico funcionando

---

### Hora 2: Privacidad + Testing

#### 20 min: Privacidad Básica
```typescript
// Tabla user_x402_settings (Supabase)
- x402_enabled: default false
- Anonimización básica de datos
```

#### 20 min: Anonimización
```typescript
// src/services/x402/anonymizer.ts
- Hash direcciones
- Agregar balances a rangos
```

#### 20 min: Testing + Demo
```typescript
// Probar flujo completo
- Solicitar endpoint
- Recibir 402
- Mockear pago
- Obtener datos anónimos
```

**Total Hora 2:** MVP funcional con privacidad

---

## 🎯 LO QUE TENEMOS EN 2 HORAS

### ✅ Funcional:
- Middleware x402 básico
- Endpoint de verificación (mock)
- Endpoint protegido con datos anónimos
- Privacidad por defecto (Opt-In)
- Anonimización básica
- Flujo completo funcional (demo)

### ❌ NO incluido (para después):
- Verificación on-chain real (mock por ahora)
- Frontend completo
- Wallet de recepción configurado
- Testing exhaustivo
- Documentación completa

---

## 🚀 PLAN DE ACCIÓN: 2 HORAS

### Minuto 0-30: Middleware x402

**Archivo:** `src/middleware/x402.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

export function x402Middleware(options: {
  amount: string;
  token: string;
  chain: string;
  serviceId: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paymentProof = req.headers['x-payment-proof'] as string;
    
    if (!paymentProof) {
      return res.status(402).json({
        payment: {
          amount: options.amount,
          currency: options.token.toUpperCase(),
          chain: options.chain,
          address: process.env.X402_RECEIVE_ADDRESS || '0x742d35...',
        },
        service: {
          id: options.serviceId,
          name: "API Access",
        }
      });
    }

    // Verificación básica (mock por ahora)
    try {
      const proof = JSON.parse(paymentProof);
      if (!proof.txHash) {
        return res.status(402).json({ error: "Invalid payment proof" });
      }
      next();
    } catch {
      return res.status(402).json({ error: "Invalid payment proof" });
    }
  };
}
```

**Tiempo:** 30 min

---

### Minuto 30-50: Endpoint de Verificación

**Archivo:** `src/routes/payments/x402.ts`

```typescript
import express from 'express';
const router = express.Router();

router.post('/verify', async (req, res) => {
  const { paymentProof } = req.body;
  
  if (!paymentProof?.txHash) {
    return res.status(400).json({ error: "Invalid payment proof" });
  }

  // Mock: Verificación básica (sin on-chain aún)
  res.json({
    success: true,
    data: {
      verified: true,
      accessToken: Buffer.from(`${Date.now()}`).toString('base64'),
      expiresAt: Date.now() + 3600000,
    }
  });
});

export default router;
```

**Tiempo:** 20 min

---

### Minuto 50-60: Endpoint Protegido

**Archivo:** `src/routes/ai/balance.ts`

```typescript
import express from 'express';
import { x402Middleware } from '../../middleware/x402';
import { anonymizeBalances } from '../../services/x402/anonymizer';

const router = express.Router();

router.get(
  '/balance-aggregated',
  x402Middleware({
    amount: '0.01',
    token: 'usdc',
    chain: 'base',
    serviceId: 'balance-query',
  }),
  async (req, res) => {
    // Mock: Obtener balances (después conectar a DB real)
    const mockBalances = [
      { balance: 50, count: 1000 },
      { balance: 500, count: 500 },
      { balance: 5000, count: 100 },
      { balance: 50000, count: 10 },
    ];

    const anonymized = anonymizeBalances(mockBalances);

    res.json({
      success: true,
      data: anonymized,
    });
  }
);

export default router;
```

**Tiempo:** 10 min

---

### Minuto 60-80: Privacidad Básica

**Archivo:** Migración Supabase

```sql
CREATE TABLE IF NOT EXISTS user_x402_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  x402_enabled BOOLEAN DEFAULT false,
  privacy_level TEXT DEFAULT 'high',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

**Tiempo:** 20 min

---

### Minuto 80-100: Anonimización

**Archivo:** `src/services/x402/anonymizer.ts`

```typescript
export function anonymizeBalances(balances: any[]) {
  const distribution: Record<string, number> = {};
  
  balances.forEach(({ balance, count }) => {
    let range: string;
    if (balance < 100) range = "0-100 USDC";
    else if (balance < 1000) range = "100-1,000 USDC";
    else if (balance < 10000) range = "1,000-10,000 USDC";
    else range = "10,000+ USDC";
    
    distribution[range] = (distribution[range] || 0) + count;
  });

  return {
    distribution,
    total_users: balances.reduce((sum, b) => sum + b.count, 0),
    // Sin direcciones identificables
    // Sin identidad personal
  };
}

export function hashAddress(address: string): string {
  // Hash básico (después usar crypto)
  return Buffer.from(address).toString('base64').substring(0, 20);
}
```

**Tiempo:** 20 min

---

### Minuto 100-120: Testing + Demo

**Archivo:** `test-x402.sh`

```bash
#!/bin/bash

# 1. Solicitar endpoint (debe retornar 402)
echo "1. Solicitar balance-aggregated..."
curl -X GET http://localhost:5000/api/v1/ai/balance-aggregated

# 2. Mockear pago
echo "\n2. Mockear pago..."
PAYMENT_PROOF='{"txHash":"0x1234...","chain":"base","token":"usdc","amount":"0.01"}'

# 3. Reenviar con pago
echo "\n3. Reenviar con pago..."
curl -X GET http://localhost:5000/api/v1/ai/balance-aggregated \
  -H "X-Payment-Proof: $PAYMENT_PROOF"
```

**Tiempo:** 20 min

---

## ✅ CHECKLIST: 2 HORAS

### Backend (Hora 1):
- [x] Middleware x402 básico (30 min)
- [x] Endpoint `/payments/x402/verify` (20 min)
- [x] Endpoint protegido `/api/v1/ai/balance-aggregated` (10 min)

### Privacidad (Hora 2):
- [x] Tabla `user_x402_settings` (20 min)
- [x] Anonimización básica (20 min)
- [x] Testing + Demo (20 min)

**Total:** 2 horas

---

## 🎯 RESULTADO EN 2 HORAS

### ✅ Funciona:
- Middleware x402 retorna 402
- Endpoint de verificación (mock)
- Endpoint protegido con datos anónimos
- Privacidad por defecto (Opt-In)
- Flujo completo funcional (demo)

### ⚠️ Mock (para después):
- Verificación on-chain (mock por ahora)
- Datos reales (mock por ahora)
- Frontend completo

---

## 🚀 DESPUÉS DE 2 HORAS

### Para Producción (2-3 semanas):
1. Verificación on-chain real (Base)
2. Conectar a datos reales (DB)
3. Frontend completo
4. Testing exhaustivo
5. Documentación

---

## ✅ CONCLUSIÓN

### ¿En 2 horas?

**SÍ, pero:**
- ✅ MVP funcional (demo)
- ✅ Flujo completo funciona
- ✅ Privacidad básica
- ⚠️ Verificación mock (no on-chain real)
- ⚠️ Datos mock (no reales aún)

**Resultado:** Demo funcional que demuestra el concepto, no producción-ready.

---

## 🎯 ¿EMPEZAMOS?

**Plan:**
1. **Minuto 0-30:** Middleware x402
2. **Minuto 30-50:** Endpoint verificación
3. **Minuto 50-60:** Endpoint protegido
4. **Minuto 60-80:** Privacidad básica
5. **Minuto 80-100:** Anonimización
6. **Minuto 100-120:** Testing + Demo

**¿Listo para empezar?**



