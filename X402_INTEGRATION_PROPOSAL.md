# 🤖 Integración x402 para Pagos con AI Agents - Propuesta Completa

**Fecha:** 2024-12-19  
**Estado:** Propuesta de implementación

---

## 📋 ¿Qué es x402?

**x402** es un protocolo de pagos que permite que agentes de inteligencia artificial realicen transacciones autónomas sin necesidad de cuentas preexistentes, claves API o procesos de autenticación complejos.

### Características principales:

- ✅ **Basado en HTTP 402**: Usa el código de estado HTTP 402 "Payment Required"
- ✅ **Pagos autónomos**: Los agentes de IA pueden pagar por servicios automáticamente
- ✅ **Micropagos eficientes**: Transacciones de montos muy pequeños con tarifas mínimas
- ✅ **Stablecoins**: Usa principalmente USDC (también compatible con otros tokens)
- ✅ **Blockchain agnóstico**: Diseñado para Base (Coinbase) pero adaptable a otras redes
- ✅ **Sin autenticación previa**: No requiere cuentas o registros complejos

---

## 🔄 ¿Cómo funciona x402?

### Flujo básico:

1. **Solicitud de acceso**: Un agente de IA solicita un recurso o servicio a un servidor
2. **Respuesta 402**: El servidor responde con código HTTP 402, indicando:
   - Monto requerido
   - Dirección de wallet para recibir el pago
   - Token a usar (generalmente USDC)
   - Información adicional del servicio
3. **Envío del pago**: El agente de IA:
   - Realiza el pago usando stablecoins (USDC)
   - Firma la transacción
   - Adjunta la prueba de pago en una nueva solicitud
4. **Verificación y entrega**: El servidor:
   - Verifica el pago en la blockchain
   - Una vez confirmado, proporciona el recurso solicitado

### Ejemplo de respuesta 402:

```json
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "payment": {
    "amount": "0.01",
    "currency": "USDC",
    "chain": "base",
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "expiresAt": "2024-12-19T12:00:00Z"
  },
  "service": {
    "name": "API Access",
    "description": "1 hour of API access"
  }
}
```

### Ejemplo de solicitud con prueba de pago:

```http
POST /api/resource HTTP/1.1
Content-Type: application/json
X-Payment-Proof: <transaction_hash>

{
  "paymentProof": {
    "txHash": "0x1234...",
    "chain": "base",
    "token": "USDC",
    "amount": "0.01",
    "timestamp": 1702998000
  },
  "request": {
    "resource": "api-access"
  }
}
```

---

## 🚀 ¿Qué sería posible con x402 en HiHODL?

### 1. **API de Pagos para AI Agents** 💰

Permitir que agentes de IA accedan a servicios de HiHODL mediante pagos automáticos:

- **Consultas de balance**: Agentes pueden consultar balances pagando una pequeña tarifa
- **Historial de transacciones**: Acceso a historial mediante micropagos
- **Conversión de tokens**: Agentes pueden convertir tokens pagando por el servicio
- **Análisis de datos**: Acceso a analytics y datos agregados

### 2. **Marketplace de Servicios** 🛒

Crear un ecosistema donde servicios pueden monetizarse automáticamente:

- **Webhooks premium**: Agentes pagan por webhooks en tiempo real
- **APIs avanzadas**: Acceso a endpoints premium mediante x402
- **Datos históricos**: Acceso a datos históricos de precios, transacciones, etc.
- **Análisis personalizados**: Agentes pagan por análisis customizados

### 3. **Integración con AI Assistants** 🤖

Permitir que asistentes de IA realicen acciones en nombre de usuarios:

- **Pagos automáticos**: El asistente puede pagar facturas automáticamente
- **Transferencias programadas**: Ejecutar transferencias según reglas
- **Gestión de carteras**: Rebalancear carteras automáticamente
- **Análisis y recomendaciones**: Proporcionar insights pagando por datos

### 4. **Micropagos y Pay-per-Use** 💸

Habilitar modelos de negocio basados en uso:

- **Pay-per-query**: Cada consulta cuesta una pequeña cantidad
- **Pay-per-action**: Cada acción (enviar, recibir) tiene un costo
- **Subscription automática**: Los agentes pueden suscribirse pagando periódicamente
- **Tiered access**: Diferentes niveles de acceso según el pago

### 5. **Integración con ecosistema Web3** 🌐

Conectar HiHODL con el ecosistema más amplio:

- **DApps que pagan**: Aplicaciones descentralizadas pueden pagar por servicios
- **Smart contracts**: Contratos inteligentes pueden usar x402 para pagos
- **Oracles**: Integración con oráculos para datos on-chain
- **Cross-chain services**: Servicios que funcionan entre múltiples blockchains

---

## 🛠️ ¿Cómo implementarlo en HiHODL?

### Arquitectura propuesta:

```
┌─────────────────┐
│   AI Agent      │
│  (Cliente)      │
└────────┬────────┘
         │
         │ 1. Solicita recurso
         ▼
┌─────────────────┐
│  HiHODL API     │
│  (Backend)      │
└────────┬────────┘
         │
         │ 2. Responde 402
         │    (monto, dirección, token)
         ▼
┌─────────────────┐
│   AI Agent      │
│  (Cliente)      │
└────────┬────────┘
         │
         │ 3. Realiza pago on-chain
         │    (USDC en Base)
         ▼
┌─────────────────┐
│  Blockchain     │
│  (Base)         │
└────────┬────────┘
         │
         │ 4. Verifica pago
         ▼
┌─────────────────┐
│  HiHODL API     │
│  (Backend)      │
└────────┬────────┘
         │
         │ 5. Entrega recurso
         ▼
┌─────────────────┐
│   AI Agent      │
│  (Cliente)      │
└─────────────────┘
```

---

## 📦 Implementación Técnica

### 1. **Backend: Middleware x402**

#### Nuevo endpoint: `POST /payments/x402/verify`

Verifica pagos x402 realizados por agentes de IA.

**Request:**
```typescript
{
  paymentProof: {
    txHash: string;
    chain: "base" | "ethereum" | "polygon";
    token: "usdc" | "usdt";
    amount: string;
    timestamp: number;
  };
  serviceId: string; // ID del servicio solicitado
  requestId: string; // ID único de la solicitud original
}
```

**Response:**
```typescript
{
  success: true;
  data: {
    verified: boolean;
    accessToken?: string; // Token temporal para acceder al servicio
    expiresAt?: number;
    service: {
      id: string;
      name: string;
      description: string;
    };
  };
}
```

#### Middleware para endpoints protegidos

```typescript
// src/middleware/x402.ts
import { Request, Response, NextFunction } from 'express';

interface X402PaymentProof {
  txHash: string;
  chain: string;
  token: string;
  amount: string;
  timestamp: number;
}

export function x402Middleware(options: {
  amount: string;
  token: string;
  chain: string;
  serviceId: string;
}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Verificar si hay prueba de pago
    const paymentProof = req.headers['x-payment-proof'] as string;
    
    if (!paymentProof) {
      // Retornar 402 con información de pago
      return res.status(402).json({
        payment: {
          amount: options.amount,
          currency: options.token.toUpperCase(),
          chain: options.chain,
          address: process.env.X402_RECEIVE_ADDRESS, // Wallet de HiHODL
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hora
        },
        service: {
          id: options.serviceId,
          name: "API Access",
          description: "Access to this endpoint"
        }
      });
    }

    // Verificar el pago en blockchain
    const verified = await verifyPayment(paymentProof, options);
    
    if (!verified) {
      return res.status(402).json({
        error: "Payment verification failed",
        payment: {
          amount: options.amount,
          currency: options.token.toUpperCase(),
          chain: options.chain,
          address: process.env.X402_RECEIVE_ADDRESS,
        }
      });
    }

    // Pago verificado, continuar
    next();
  };
}

async function verifyPayment(
  proof: string,
  options: { amount: string; token: string; chain: string }
): Promise<boolean> {
  // Implementar verificación on-chain
  // 1. Obtener transacción de blockchain
  // 2. Verificar que el monto es correcto
  // 3. Verificar que el destinatario es correcto
  // 4. Verificar que el token es correcto
  // 5. Verificar timestamp (no muy antiguo)
  
  // Ejemplo usando Base:
  const tx = await getTransaction(proof, options.chain);
  return (
    tx.to.toLowerCase() === process.env.X402_RECEIVE_ADDRESS.toLowerCase() &&
    tx.amount === options.amount &&
    tx.token === options.token &&
    Date.now() - tx.timestamp < 3600000 // 1 hora
  );
}
```

#### Nuevos endpoints protegidos con x402

```typescript
// Ejemplo: Endpoint de balance para AI agents
app.get('/api/v1/ai/balance', 
  x402Middleware({
    amount: '0.001', // 0.001 USDC
    token: 'usdc',
    chain: 'base',
    serviceId: 'balance-query'
  }),
  async (req, res) => {
    // Lógica para obtener balance
    const balance = await getBalance(req.query.address);
    res.json({ success: true, data: balance });
  }
);

// Ejemplo: Endpoint de historial para AI agents
app.get('/api/v1/ai/transactions',
  x402Middleware({
    amount: '0.01', // 0.01 USDC
    token: 'usdc',
    chain: 'base',
    serviceId: 'transaction-history'
  }),
  async (req, res) => {
    const transactions = await getTransactions(req.query.address);
    res.json({ success: true, data: transactions });
  }
);
```

### 2. **Frontend: Servicio x402**

#### Nuevo servicio: `src/services/api/x402.service.ts`

```typescript
// src/services/api/x402.service.ts
import { apiClient } from '@/lib/apiClient';

export interface X402PaymentRequest {
  amount: string;
  currency: string;
  chain: string;
  address: string;
  expiresAt: string;
  service: {
    id: string;
    name: string;
    description: string;
  };
}

export interface X402PaymentProof {
  txHash: string;
  chain: string;
  token: string;
  amount: string;
  timestamp: number;
}

export interface X402VerifyRequest {
  paymentProof: X402PaymentProof;
  serviceId: string;
  requestId: string;
}

export interface X402VerifyResponse {
  success: boolean;
  data: {
    verified: boolean;
    accessToken?: string;
    expiresAt?: number;
    service: {
      id: string;
      name: string;
      description: string;
    };
  };
}

/**
 * Verifica un pago x402 realizado por un agente de IA
 */
export async function verifyX402Payment(
  params: X402VerifyRequest
): Promise<X402VerifyResponse> {
  return apiClient.post<X402VerifyResponse>('/payments/x402/verify', params);
}

/**
 * Obtiene información de pago requerido (cuando se recibe 402)
 */
export function parseX402Response(response: any): X402PaymentRequest | null {
  if (response.status === 402 && response.data?.payment) {
    return response.data;
  }
  return null;
}
```

### 3. **Configuración de Wallet x402**

#### Variables de entorno necesarias:

```env
# x402 Configuration
X402_ENABLED=true
X402_RECEIVE_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
X402_CHAIN=base
X402_TOKEN=usdc
X402_MIN_AMOUNT=0.001
X402_EXPIRY_TIME=3600000 # 1 hora en ms
```

#### Wallet dedicado para x402:

- Crear un wallet específico para recibir pagos x402
- Configurar en Base network (principal)
- Soporte para USDC en Base
- Monitoreo de transacciones entrantes

### 4. **Verificación de Pagos On-Chain**

#### Servicio de verificación: `src/services/x402/verifier.ts`

```typescript
// src/services/x402/verifier.ts
import { ethers } from 'ethers';
import { AlchemyProvider } from '@alchemy/sdk';

interface PaymentVerification {
  verified: boolean;
  txHash: string;
  amount: string;
  token: string;
  from: string;
  to: string;
  timestamp: number;
}

export class X402Verifier {
  private provider: ethers.Provider;
  private receiveAddress: string;

  constructor(chain: string, receiveAddress: string) {
    this.receiveAddress = receiveAddress.toLowerCase();
    // Inicializar provider según chain
    if (chain === 'base') {
      this.provider = new ethers.JsonRpcProvider(
        process.env.BASE_RPC_URL || 'https://mainnet.base.org'
      );
    }
    // ... otros chains
  }

  async verifyPayment(
    txHash: string,
    expectedAmount: string,
    expectedToken: string
  ): Promise<PaymentVerification> {
    try {
      // Obtener transacción
      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        return { verified: false, ... } as PaymentVerification;
      }

      // Obtener recibo
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        return { verified: false, ... } as PaymentVerification;
      }

      // Verificar token transfer (USDC)
      const usdcAddress = this.getUSDCAddress();
      const transferEvent = this.parseTransferEvent(receipt, usdcAddress);

      if (!transferEvent) {
        return { verified: false, ... } as PaymentVerification;
      }

      // Verificar condiciones
      const verified = (
        transferEvent.to.toLowerCase() === this.receiveAddress &&
        transferEvent.amount === expectedAmount &&
        transferEvent.token === expectedToken &&
        Date.now() - receipt.timestamp * 1000 < 3600000 // 1 hora
      );

      return {
        verified,
        txHash,
        amount: transferEvent.amount,
        token: transferEvent.token,
        from: transferEvent.from,
        to: transferEvent.to,
        timestamp: receipt.timestamp * 1000,
      };
    } catch (error) {
      console.error('X402 verification error:', error);
      return { verified: false, ... } as PaymentVerification;
    }
  }

  private getUSDCAddress(): string {
    // USDC en Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    return process.env.USDC_BASE_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  }

  private parseTransferEvent(receipt: any, tokenAddress: string): any {
    // Parsear evento Transfer de ERC20
    // Implementar según ABI del token
  }
}
```

### 5. **Dashboard para Monitoreo x402**

#### Nueva pantalla: `app/(drawer)/(internal)/x402/index.tsx`

```typescript
// Pantalla para monitorear pagos x402 recibidos
// Mostrar:
// - Pagos recibidos
// - Servicios más usados
// - Ingresos por servicio
// - Estadísticas de uso
```

---

## 📊 Casos de Uso Específicos

### Caso 1: AI Agent consulta balance

```
1. AI Agent → GET /api/v1/ai/balance?address=0x...
2. Backend → 402 Payment Required
   {
     "payment": {
       "amount": "0.001",
       "currency": "USDC",
       "chain": "base",
       "address": "0x742d35..."
     }
   }
3. AI Agent → Realiza pago de 0.001 USDC en Base
4. AI Agent → GET /api/v1/ai/balance?address=0x...&paymentProof=0x1234...
5. Backend → Verifica pago → Retorna balance
```

### Caso 2: AI Agent accede a historial

```
1. AI Agent → GET /api/v1/ai/transactions?address=0x...
2. Backend → 402 Payment Required (0.01 USDC)
3. AI Agent → Paga → Obtiene historial completo
```

### Caso 3: DApp integra x402

```
1. DApp necesita datos de HiHODL
2. DApp → Solicita recurso
3. HiHODL → 402 con información de pago
4. DApp → Usuario paga (o DApp paga automáticamente)
5. DApp → Obtiene datos
```

---

## 🔒 Consideraciones de Seguridad

### 1. **Validación de Pagos**

- ✅ Verificar transacciones on-chain
- ✅ Validar montos exactos
- ✅ Verificar timestamps (no muy antiguos)
- ✅ Validar direcciones de destino
- ✅ Verificar tokens correctos

### 2. **Rate Limiting**

- ✅ Limitar solicitudes por IP
- ✅ Limitar verificaciones de pago
- ✅ Prevenir spam de solicitudes 402

### 3. **Prevención de Replay Attacks**

- ✅ Usar requestId único por solicitud
- ✅ Marcar pagos como usados
- ✅ Expirar solicitudes después de cierto tiempo

### 4. **Monitoreo**

- ✅ Logs de todas las solicitudes x402
- ✅ Alertas para pagos sospechosos
- ✅ Dashboard de métricas

---

## 📈 Roadmap de Implementación

### Fase 1: MVP (2-3 semanas)

- [ ] Implementar middleware x402 en backend
- [ ] Crear endpoint `/payments/x402/verify`
- [ ] Implementar verificación on-chain básica
- [ ] Configurar wallet de recepción
- [ ] Documentar API para AI agents

### Fase 2: Integración (2-3 semanas)

- [ ] Crear 3-5 endpoints protegidos con x402
- [ ] Implementar servicio frontend
- [ ] Crear dashboard de monitoreo
- [ ] Testing con agentes de IA reales

### Fase 3: Expansión (3-4 semanas)

- [ ] Agregar más servicios protegidos
- [ ] Implementar sistema de suscripciones
- [ ] Crear marketplace de servicios
- [ ] Integración con más blockchains

### Fase 4: Optimización (2-3 semanas)

- [ ] Optimizar verificación de pagos
- [ ] Implementar caching
- [ ] Mejorar UX para AI agents
- [ ] Documentación completa

---

## 💡 Ventajas para HiHODL

1. **Nuevo modelo de negocio**: Monetizar APIs mediante micropagos
2. **Ecosistema AI**: Convertirse en plataforma para agentes de IA
3. **Innovación**: Ser pionero en pagos autónomos para AI
4. **Escalabilidad**: Modelo pay-per-use escalable
5. **Web3 Native**: Integración natural con ecosistema Web3

---

## 🚧 Desafíos y Consideraciones

### Desafíos:

1. **Gas fees**: En Ethereum puede ser costoso, mejor usar Base
2. **Latencia**: Verificación on-chain puede tomar tiempo
3. **Complejidad**: Implementación requiere conocimiento de blockchain
4. **Adopción**: Necesita que AI agents adopten el protocolo

### Soluciones:

1. ✅ Usar Base (gas fees bajos)
2. ✅ Implementar verificación asíncrona
3. ✅ Crear SDK para facilitar integración
4. ✅ Documentación clara y ejemplos

---

## 📚 Recursos y Referencias

- [x402 Protocol](https://www.olivia402.live/)
- [Base Network](https://base.org/)
- [USDC on Base](https://www.circle.com/en/usdc)

---

## ✅ Conclusión

La integración de x402 en HiHODL permitiría:

- ✅ Monetizar servicios mediante micropagos
- ✅ Habilitar pagos autónomos para AI agents
- ✅ Crear un nuevo modelo de negocio
- ✅ Posicionar HiHODL como plataforma innovadora
- ✅ Integrar con el ecosistema Web3

**Recomendación**: Implementar en fases, empezando con MVP simple y expandiendo según adopción.



