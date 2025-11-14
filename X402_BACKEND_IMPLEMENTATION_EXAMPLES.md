# 🔧 Ejemplos de Implementación Backend - x402

Este documento contiene ejemplos de código para implementar x402 en el backend de HiHODL.

---

## 📦 Dependencias Necesarias

```json
{
  "dependencies": {
    "ethers": "^6.15.0",
    "@alchemy/sdk": "^3.0.0",
    "express": "^4.18.0"
  }
}
```

---

## 1. Middleware x402

### `src/middleware/x402.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { X402Verifier } from '../services/x402/verifier';

interface X402Options {
  amount: string;
  token: string;
  chain: string;
  serviceId: string;
  serviceName: string;
  serviceDescription: string;
}

export function x402Middleware(options: X402Options) {
  const verifier = new X402Verifier(
    options.chain,
    process.env.X402_RECEIVE_ADDRESS!
  );

  return async (req: Request, res: Response, next: NextFunction) => {
    // Verificar si hay prueba de pago en headers
    const paymentProofHeader = req.headers['x-payment-proof'] as string;
    const requestId = req.headers['x-request-id'] as string || 
                      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (!paymentProofHeader) {
      // Retornar 402 con información de pago
      return res.status(402).json({
        payment: {
          amount: options.amount,
          currency: options.token.toUpperCase(),
          chain: options.chain,
          address: process.env.X402_RECEIVE_ADDRESS,
          expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hora
        },
        service: {
          id: options.serviceId,
          name: options.serviceName,
          description: options.serviceDescription,
        },
        requestId: requestId,
      });
    }

    try {
      // Parsear prueba de pago
      const paymentProof = JSON.parse(paymentProofHeader);

      // Verificar el pago en blockchain
      const verification = await verifier.verifyPayment(
        paymentProof.txHash,
        options.amount,
        options.token
      );

      if (!verification.verified) {
        return res.status(402).json({
          error: "Payment verification failed",
          message: verification.error || "Invalid payment proof",
          payment: {
            amount: options.amount,
            currency: options.token.toUpperCase(),
            chain: options.chain,
            address: process.env.X402_RECEIVE_ADDRESS,
          },
          requestId: requestId,
        });
      }

      // Verificar que el pago no haya sido usado antes (prevenir replay)
      const paymentUsed = await checkPaymentUsed(paymentProof.txHash);
      if (paymentUsed) {
        return res.status(402).json({
          error: "Payment already used",
          message: "This payment has already been used",
          payment: {
            amount: options.amount,
            currency: options.token.toUpperCase(),
            chain: options.chain,
            address: process.env.X402_RECEIVE_ADDRESS,
          },
        });
      }

      // Marcar pago como usado
      await markPaymentUsed(paymentProof.txHash, requestId);

      // Agregar información de pago al request para uso posterior
      (req as any).x402Payment = verification;
      (req as any).x402RequestId = requestId;

      // Continuar con el siguiente middleware
      next();
    } catch (error) {
      console.error('X402 middleware error:', error);
      return res.status(402).json({
        error: "Payment verification error",
        message: error instanceof Error ? error.message : "Unknown error",
        payment: {
          amount: options.amount,
          currency: options.token.toUpperCase(),
          chain: options.chain,
          address: process.env.X402_RECEIVE_ADDRESS,
        },
      });
    }
  };
}

// Helper para verificar si un pago ya fue usado
async function checkPaymentUsed(txHash: string): Promise<boolean> {
  // Implementar verificación en base de datos
  // Ejemplo con Supabase:
  // const { data } = await supabase
  //   .from('x402_payments')
  //   .select('id')
  //   .eq('tx_hash', txHash)
  //   .single();
  // return !!data;
  return false; // Placeholder
}

// Helper para marcar pago como usado
async function markPaymentUsed(txHash: string, requestId: string): Promise<void> {
  // Implementar guardado en base de datos
  // Ejemplo con Supabase:
  // await supabase
  //   .from('x402_payments')
  //   .insert({
  //     tx_hash: txHash,
  //     request_id: requestId,
  //     used_at: new Date().toISOString(),
  //   });
}
```

---

## 2. Verificador de Pagos On-Chain

### `src/services/x402/verifier.ts`

```typescript
import { ethers } from 'ethers';
import { Alchemy, Network } from 'alchemy-sdk';

interface PaymentVerification {
  verified: boolean;
  txHash: string;
  amount: string;
  token: string;
  from: string;
  to: string;
  timestamp: number;
  error?: string;
}

export class X402Verifier {
  private provider: ethers.Provider;
  private receiveAddress: string;
  private alchemy?: Alchemy;

  constructor(chain: string, receiveAddress: string) {
    this.receiveAddress = receiveAddress.toLowerCase();

    // Configurar provider según chain
    if (chain === 'base') {
      // Base Mainnet
      this.provider = new ethers.JsonRpcProvider(
        process.env.BASE_RPC_URL || 'https://mainnet.base.org'
      );
      
      // Opcional: Usar Alchemy para mejor performance
      if (process.env.ALCHEMY_API_KEY) {
        this.alchemy = new Alchemy({
          apiKey: process.env.ALCHEMY_API_KEY,
          network: Network.BASE_MAINNET,
        });
      }
    } else if (chain === 'ethereum') {
      this.provider = new ethers.JsonRpcProvider(
        process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com'
      );
    } else if (chain === 'polygon') {
      this.provider = new ethers.JsonRpcProvider(
        process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com'
      );
    } else {
      throw new Error(`Unsupported chain: ${chain}`);
    }
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
        return {
          verified: false,
          txHash,
          amount: '0',
          token: expectedToken,
          from: '',
          to: '',
          timestamp: 0,
          error: 'Transaction not found',
        };
      }

      // Obtener recibo
      const receipt = await this.provider.getTransactionReceipt(txHash);
      if (!receipt || receipt.status !== 1) {
        return {
          verified: false,
          txHash,
          amount: '0',
          token: expectedToken,
          from: '',
          to: '',
          timestamp: 0,
          error: 'Transaction failed or not confirmed',
        };
      }

      // Obtener timestamp del bloque
      const block = await this.provider.getBlock(receipt.blockNumber);
      const timestamp = block?.timestamp || 0;

      // Verificar que la transacción no sea muy antigua (máximo 1 hora)
      const age = Date.now() - timestamp * 1000;
      if (age > 3600000) {
        return {
          verified: false,
          txHash,
          amount: '0',
          token: expectedToken,
          from: '',
          to: '',
          timestamp: timestamp * 1000,
          error: 'Transaction too old',
        };
      }

      // Parsear eventos de transferencia
      const transferEvent = await this.parseTransferEvent(
        receipt,
        expectedToken
      );

      if (!transferEvent) {
        return {
          verified: false,
          txHash,
          amount: '0',
          token: expectedToken,
          from: '',
          to: '',
          timestamp: timestamp * 1000,
          error: 'Transfer event not found',
        };
      }

      // Verificar condiciones
      const verified = (
        transferEvent.to.toLowerCase() === this.receiveAddress &&
        transferEvent.amount === expectedAmount &&
        transferEvent.token.toLowerCase() === expectedToken.toLowerCase()
      );

      return {
        verified,
        txHash,
        amount: transferEvent.amount,
        token: transferEvent.token,
        from: transferEvent.from,
        to: transferEvent.to,
        timestamp: timestamp * 1000,
        error: verified ? undefined : 'Payment verification failed',
      };
    } catch (error) {
      console.error('X402 verification error:', error);
      return {
        verified: false,
        txHash,
        amount: '0',
        token: expectedToken,
        from: '',
        to: '',
        timestamp: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async parseTransferEvent(
    receipt: any,
    token: string
  ): Promise<{ from: string; to: string; amount: string; token: string } | null> {
    // Obtener dirección del token
    const tokenAddress = this.getTokenAddress(token);
    if (!tokenAddress) {
      return null;
    }

    // ABI del evento Transfer de ERC20
    const transferEventAbi = [
      'event Transfer(address indexed from, address indexed to, uint256 value)',
    ];

    const iface = new ethers.Interface(transferEventAbi);

    // Buscar evento Transfer
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog(log);
        if (parsed && parsed.name === 'Transfer') {
          // Verificar que el log sea del token correcto
          if (log.address.toLowerCase() === tokenAddress.toLowerCase()) {
            return {
              from: parsed.args.from,
              to: parsed.args.to,
              amount: parsed.args.value.toString(),
              token: token,
            };
          }
        }
      } catch (e) {
        // Continuar buscando
        continue;
      }
    }

    return null;
  }

  private getTokenAddress(token: string): string | null {
    const addresses: Record<string, Record<string, string>> = {
      base: {
        usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        usdt: '0xfde4C96c8593536E31F229EA8f37b2ADa2699f50',
      },
      ethereum: {
        usdc: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        usdt: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      },
      polygon: {
        usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        usdt: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      },
    };

    const chain = process.env.X402_CHAIN || 'base';
    return addresses[chain]?.[token.toLowerCase()] || null;
  }
}
```

---

## 3. Endpoints Protegidos con x402

### `src/routes/ai/balance.ts`

```typescript
import express from 'express';
import { x402Middleware } from '../../middleware/x402';

const router = express.Router();

// Endpoint protegido con x402
router.get(
  '/balance',
  x402Middleware({
    amount: '0.001', // 0.001 USDC
    token: 'usdc',
    chain: 'base',
    serviceId: 'balance-query',
    serviceName: 'Balance Query',
    serviceDescription: 'Query wallet balance',
  }),
  async (req, res) => {
    try {
      const address = req.query.address as string;
      
      if (!address) {
        return res.status(400).json({
          error: 'Address is required',
        });
      }

      // Obtener balance (implementar según tu lógica)
      const balance = await getBalance(address);

      res.json({
        success: true,
        data: {
          address,
          balance,
          timestamp: Date.now(),
        },
      });
    } catch (error) {
      console.error('Balance query error:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
);

async function getBalance(address: string): Promise<any> {
  // Implementar lógica para obtener balance
  // Puede usar tu servicio de balances existente
  return {
    // ... datos de balance
  };
}

export default router;
```

### `src/routes/ai/transactions.ts`

```typescript
import express from 'express';
import { x402Middleware } from '../../middleware/x402';

const router = express.Router();

router.get(
  '/transactions',
  x402Middleware({
    amount: '0.01', // 0.01 USDC
    token: 'usdc',
    chain: 'base',
    serviceId: 'transaction-history',
    serviceName: 'Transaction History',
    serviceDescription: 'Get transaction history',
  }),
  async (req, res) => {
    try {
      const address = req.query.address as string;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!address) {
        return res.status(400).json({
          error: 'Address is required',
        });
      }

      // Obtener transacciones
      const transactions = await getTransactions(address, limit, offset);

      res.json({
        success: true,
        data: {
          address,
          transactions,
          pagination: {
            limit,
            offset,
            total: transactions.length,
          },
        },
      });
    } catch (error) {
      console.error('Transaction history error:', error);
      res.status(500).json({
        error: 'Internal server error',
      });
    }
  }
);

async function getTransactions(
  address: string,
  limit: number,
  offset: number
): Promise<any[]> {
  // Implementar lógica para obtener transacciones
  return [];
}

export default router;
```

---

## 4. Endpoint de Verificación

### `src/routes/payments/x402.ts`

```typescript
import express from 'express';
import { X402Verifier } from '../../services/x402/verifier';

const router = express.Router();

/**
 * POST /payments/x402/verify
 * Verifica un pago x402 realizado por un agente de IA
 */
router.post('/verify', async (req, res) => {
  try {
    const { paymentProof, serviceId, requestId } = req.body;

    if (!paymentProof || !serviceId || !requestId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['paymentProof', 'serviceId', 'requestId'],
      });
    }

    // Obtener configuración del servicio
    const serviceConfig = getServiceConfig(serviceId);
    if (!serviceConfig) {
      return res.status(404).json({
        error: 'Service not found',
      });
    }

    // Verificar pago
    const verifier = new X402Verifier(
      serviceConfig.chain,
      process.env.X402_RECEIVE_ADDRESS!
    );

    const verification = await verifier.verifyPayment(
      paymentProof.txHash,
      serviceConfig.amount,
      serviceConfig.token
    );

    if (!verification.verified) {
      return res.status(402).json({
        success: false,
        data: {
          verified: false,
          error: verification.error,
        },
      });
    }

    // Generar token de acceso temporal (opcional)
    const accessToken = generateAccessToken(serviceId, requestId);
    const expiresAt = Date.now() + 3600000; // 1 hora

    res.json({
      success: true,
      data: {
        verified: true,
        accessToken,
        expiresAt,
        service: {
          id: serviceConfig.serviceId,
          name: serviceConfig.serviceName,
          description: serviceConfig.serviceDescription,
        },
      },
    });
  } catch (error) {
    console.error('X402 verify error:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

function getServiceConfig(serviceId: string): any {
  const services: Record<string, any> = {
    'balance-query': {
      serviceId: 'balance-query',
      amount: '0.001',
      token: 'usdc',
      chain: 'base',
      serviceName: 'Balance Query',
      serviceDescription: 'Query wallet balance',
    },
    'transaction-history': {
      serviceId: 'transaction-history',
      amount: '0.01',
      token: 'usdc',
      chain: 'base',
      serviceName: 'Transaction History',
      serviceDescription: 'Get transaction history',
    },
    // Agregar más servicios aquí
  };

  return services[serviceId];
}

function generateAccessToken(serviceId: string, requestId: string): string {
  // Implementar generación de token JWT o similar
  // Por ahora, retornar un token simple
  return Buffer.from(`${serviceId}:${requestId}:${Date.now()}`).toString('base64');
}

export default router;
```

---

## 5. Schema de Base de Datos

### Tabla `x402_payments` (Supabase)

```sql
CREATE TABLE x402_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tx_hash TEXT NOT NULL UNIQUE,
  request_id TEXT NOT NULL,
  service_id TEXT NOT NULL,
  amount TEXT NOT NULL,
  token TEXT NOT NULL,
  chain TEXT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_x402_payments_tx_hash ON x402_payments(tx_hash);
CREATE INDEX idx_x402_payments_request_id ON x402_payments(request_id);
CREATE INDEX idx_x402_payments_service_id ON x402_payments(service_id);
```

### Tabla `x402_services` (Supabase)

```sql
CREATE TABLE x402_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  amount TEXT NOT NULL,
  token TEXT NOT NULL,
  chain TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 6. Variables de Entorno

### `.env`

```env
# x402 Configuration
X402_ENABLED=true
X402_RECEIVE_ADDRESS=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
X402_CHAIN=base
X402_TOKEN=usdc
X402_MIN_AMOUNT=0.001
X402_EXPIRY_TIME=3600000

# RPC URLs
BASE_RPC_URL=https://mainnet.base.org
ETHEREUM_RPC_URL=https://eth.llamarpc.com
POLYGON_RPC_URL=https://polygon.llamarpc.com

# Alchemy (opcional, para mejor performance)
ALCHEMY_API_KEY=your_alchemy_api_key
```

---

## 7. Integración en app principal

### `src/app.ts` (ejemplo)

```typescript
import express from 'express';
import aiRoutes from './routes/ai';
import x402Routes from './routes/payments/x402';

const app = express();

app.use(express.json());

// Rutas x402
app.use('/api/v1/payments/x402', x402Routes);

// Rutas AI protegidas con x402
app.use('/api/v1/ai', aiRoutes);

// ... otras rutas

export default app;
```

---

## 📝 Notas de Implementación

1. **Rate Limiting**: Agregar rate limiting para prevenir abuso
2. **Caching**: Cachear verificaciones de pagos para mejorar performance
3. **Logging**: Loggear todas las solicitudes x402 para auditoría
4. **Monitoring**: Monitorear métricas de uso y pagos
5. **Error Handling**: Manejar errores de manera robusta

---

## ✅ Testing

### Test manual con curl:

```bash
# 1. Solicitar recurso (debe retornar 402)
curl -X GET http://localhost:3000/api/v1/ai/balance?address=0x...

# 2. Realizar pago on-chain (usar wallet)
# ... realizar pago de 0.001 USDC en Base

# 3. Verificar pago
curl -X POST http://localhost:3000/api/v1/payments/x402/verify \
  -H "Content-Type: application/json" \
  -d '{
    "paymentProof": {
      "txHash": "0x...",
      "chain": "base",
      "token": "usdc",
      "amount": "0.001",
      "timestamp": 1234567890
    },
    "serviceId": "balance-query",
    "requestId": "req_123"
  }'

# 4. Usar recurso con prueba de pago
curl -X GET http://localhost:3000/api/v1/ai/balance?address=0x... \
  -H "X-Payment-Proof: {\"txHash\":\"0x...\",\"chain\":\"base\",\"token\":\"usdc\",\"amount\":\"0.001\",\"timestamp\":1234567890}" \
  -H "X-Request-Id: req_123"
```

---

## 🚀 Próximos Pasos

1. Implementar middleware x402
2. Crear verificador de pagos
3. Configurar wallet de recepción
4. Crear endpoints protegidos
5. Testing con agentes de IA reales
6. Documentar API para desarrolladores



