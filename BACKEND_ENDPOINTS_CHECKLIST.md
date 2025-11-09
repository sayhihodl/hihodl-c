# 📋 Checklist de Endpoints Backend - HiHODL

**Stack:** Node.js + TypeScript, NestJS, Prisma (Postgres), Redis + BullMQ, **Supabase Auth**, Sentry + OpenTelemetry  
**Chains:** Ethereum (EVM), Base (EVM), Polygon (EVM), Solana  
**Última actualización:** 2024-11-02 - Estado actualizado según implementación real  
**Estado:** 🟢 **83% Completado** (58/70 endpoints implementados)

> **Ver:** `BACKEND_ENDPOINTS_STATUS.md` para estado detallado y endpoints pendientes

---

## ✅ ENDPOINTS CRÍTICOS PARA MVP

### 🔐 1. Auth & Users (10 endpoints) ✅ COMPLETO

#### Supabase Auth Endpoints

- [x] **POST `/auth/supabase`** ✅ **IMPLEMENTADO**
  - Verifica Supabase Access Token (ruta implementada: `/auth/supabase` vs `/auth/supabase/verify` en checklist)
  - Retorna información del usuario o crea sesión interna
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { token, user: { id, supabaseUid, email } } }`

- [x] **POST `/auth/refresh`** ✅ **IMPLEMENTADO**
  - Refresca token de Supabase
  - Body: `{ refreshToken }`
  - Response: `{ success: true, data: { accessToken, refreshToken, expiresAt } }`

#### Passkeys Endpoints

- [x] **POST `/passkeys/register/begin`** ✅ **IMPLEMENTADO**
  - Inicia registro de passkey
  - Request: `{ email, userId? }`
  - Response: `{ success: true, data: { publicKey: {...} } }`
  - **Nota:** Ruta implementada: `/passkeys/register/begin` (sin `/api` prefix)

- [x] **POST `/passkeys/register/complete`** ✅ **IMPLEMENTADO**
  - Completa registro de passkey
  - Request: `{ credential: {...} }`
  - Response: `{ success: true, data: { credentialId, user, session } }`

- [x] **POST `/passkeys/login/begin`** ✅ **IMPLEMENTADO**
  - Inicia autenticación con passkey
  - Request: `{ email }`
  - Response: `{ success: true, data: { publicKey: {...} } }`

- [x] **POST `/passkeys/login/complete`** ✅ **IMPLEMENTADO**
  - Completa autenticación con passkey
  - Request: `{ assertion: {...} }`
  - Response: `{ success: true, data: { user, session } }`

- [x] **GET `/passkeys/list`** ✅ **IMPLEMENTADO**
  - Lista passkeys del usuario
  - Response: `{ success: true, data: { passkeys: [...] } }`

- [x] **DELETE `/passkeys/:id`** ✅ **IMPLEMENTADO**
  - Elimina un passkey
  - Response: `{ success: true, data: { deleted: true } }`

#### User Profile Endpoints

- [x] **GET `/me`** ✅ **IMPLEMENTADO**
  - Obtiene perfil del usuario autenticado
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { id, supabaseUid, email, profile } }`

- [x] **PATCH `/me`** ✅ **IMPLEMENTADO**
  - Actualiza perfil del usuario
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ displayName?, country?, plan? }`
  - Response: `{ success: true, data: { id, email, profile } }`

---

### 💼 2. Wallets & Alias (6 endpoints) - 4/6 Implementados

#### Wallets (4/4) ✅ COMPLETO

- [x] **POST `/wallets/link`** ✅ **IMPLEMENTADO**
  - Vincula wallet externa al usuario
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ chain: "eth" | "base" | "polygon" | "sol", address: string, label?: string }`
  - Response: `{ success: true, data: { id, userId, chain, address, label, createdAt } }`

- [x] **GET `/wallets`** ✅ **IMPLEMENTADO**
  - Lista wallets del usuario
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Query: `?chains=eth,base,polygon,sol` (opcional, filtrar por chains)
  - Response: `{ success: true, data: { wallets: [...] } }`

- [x] **GET `/wallets/:walletId/receive-address`** ✅ **IMPLEMENTADO**
  - Obtiene dirección de recepción para un wallet
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Query: `?chain=eth|base|polygon|sol&token?=<tokenId>&reuse_policy=current|new&account?=daily|savings|social`
  - Response: `{ success: true, data: { address, address_id, expires_at?, provision_more? } }`
  - **USADO EN:** `src/hooks/useReceiveAddress.ts`

- [x] **POST `/wallets/:walletId/addresses/batch`** ✅ **IMPLEMENTADO**
  - Provisiona batch de direcciones (Solana principalmente)
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ addresses: string[] }`
  - Response: `{ success: true, data: { provisioned: number } }`

#### Alias (0/2) 🔴 PENDIENTE

- [ ] **POST `/alias`** 🔴 **PENDIENTE - CRÍTICO**
  - Crea/actualiza alias del usuario
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ alias: string, targetChain: ChainId, targetAddress: string }`
  - Response: `{ success: true, data: { id, userId, alias, targetChain, targetAddress } }`
  - **PRIORIDAD:** 🔴 Alta - Necesario para crear `@username`

- [ ] **GET `/alias/resolve/:alias`** 🔴 **PENDIENTE - CRÍTICO**
  - Resuelve alias a dirección/chain
  - Headers: `Authorization: Bearer <supabaseAccessToken>` (opcional para aliases públicos)
  - Response: `{ success: true, data: { alias, targetChain, targetAddress, resolvedAt } }`
  - **NECESARIO PARA:** Resolver `@username` → dirección de wallet
  - **PRIORIDAD:** 🔴 Alta - Bloquea feature de alias

---

### 💰 3. Balances & Prices (3 endpoints) ✅ COMPLETO

- [x] **GET `/balances`** ✅ **IMPLEMENTADO**
  - Obtiene balances del usuario por chain
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Query: `?chains=eth,base,polygon,sol&account=daily|savings|social`
  - Response: `{ success: true, data: { balances: [{ tokenId, chain, amount, account, rawAmount }], updatedAt } }`
  - **Cache:** Redis 15-60s keyed by `userId:chain:account`
  - **USADO EN:** `src/store/balances.ts`, dashboard, QuickSendScreen

- [x] **GET `/prices`** ✅ **IMPLEMENTADO**
  - Obtiene precios de tokens
  - Headers: `Authorization: Bearer <supabaseAccessToken>` (opcional para precios públicos)
  - Query: `?symbols=USDC,SOL,ETH,MATIC&fiat=USD`
  - Response: `{ success: true, data: { prices: [{ symbol, price, fiat, updatedAt }] } }`
  - **Cache:** Redis 30-60s keyed by Coingecko IDs

- [x] **GET `/prices/history`** ✅ **IMPLEMENTADO**
  - Historial de precios para gráficos
  - Query: `?symbol=USDC&days=7|30|90|365&fiat=USD`
  - Response: `{ success: true, data: { symbol, prices: [{ timestamp, price }] } }`

---

### 🔄 4. Transfers (6 endpoints) - 4/6 Implementados

- [x] **POST `/transfers/quote`** ✅ **IMPLEMENTADO**
  - Obtiene quote para transferencia (fees, tiempo estimado)
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ fromWalletId, to: string (alias|address), token: TokenRef, amount: string }`
  - Response: `{ success: true, data: { estimatedFee, estimatedTime, canProceed, errors? } }`
  - **TokenRef:** `{ chain: "sol"; mint: string } | { chain: "eth"|"base"|"polygon"; contract?: string }`

- [x] **POST `/transfers/submit`** ✅ **IMPLEMENTADO**
  - Envía transferencia (encola → worker procesa)
  - Headers: `Authorization: Bearer <supabaseAccessToken>`, `Idempotency-Key: <unique-key>` (recomendado)
  - Body: `{ fromWalletId, to, token, amount, account, autoBridge? }`
  - Response: `{ success: true, data: { transferId, status: "queued", estimatedTime } }`
  - **USADO EN:** `src/send/api/sendPayment.ts`
  - **Nota:** Worker valida límites, construye tx (Solana: meta-tx relayer, EVM: EOA estándar v1)

- [x] **GET `/transfers/:id`** ✅ **IMPLEMENTADO**
  - Obtiene estado de transferencia
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { id, userId, chain, tokenId, amount, fromWalletId, toAddress, status, txHash?, error?, createdAt, updatedAt } }`
  - **USADO EN:** Polling en `PaymentsThread.tsx`

- [x] **GET `/transfers`** ✅ **IMPLEMENTADO**
  - Lista transferencias del usuario (historial)
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Query: `?chain=eth|base|polygon|sol&status=pending|confirmed|failed&limit=50&offset=0`
  - Response: `{ success: true, data: { transfers: [...], total, hasMore } }`

#### Extras Pendientes

- [ ] **GET `/transfers/:id/details`** 🟡 **PENDIENTE - OPCIONAL**
  - Detalles completos de transferencia (extendido)
  - Response: `{ id, from, to, token, amount, fee, status, txHash, explorerUrl, createdAt, confirmedAt?, blocks?, gasUsed? }`
  - **PRIORIDAD:** 🟡 Media - Mejora UX pero no bloqueante

- [ ] **GET `/transfers/summary`** 🟡 **PENDIENTE - OPCIONAL**
  - Resumen de actividad (estadísticas)
  - Query: `?range=7d|30d|90d|1y`
  - Response: `{ totalSent, totalReceived, totalFees, countSent, countReceived, topTokens: [...], topRecipients: [...] }`
  - **PRIORIDAD:** 🟡 Media - Feature de analytics

---

### 💸 5. Payments (Alternative Payment Methods) (6 endpoints) ✅ COMPLETO

- [x] **POST `/payments/send`** ✅ **IMPLEMENTADO**
  - Alias de `/transfers/submit` con formato simplificado
  - Headers: `Authorization: Bearer <supabaseAccessToken>`, `Idempotency-Key: <unique-key>` (recomendado)
  - Body: `{ to: string, tokenId: string, chain: ChainKey, amount: string, account: "daily"|"savings"|"social", autoBridge? }`
  - Response: `{ success: true, data: { txId, status: "pending", ts, fee? } }`
  - **USADO EN:** `src/send/api/sendPayment.ts`

- [x] **POST `/payments/request`** ✅ **IMPLEMENTADO**
  - Crea payment request (solicitar pago)
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ from: string (handle), tokenId, chain, amount, account }`
  - Response: `{ success: true, data: { requestId, status: "requested", ts } }`
  - **USADO EN:** `src/send/api/createPaymentRequest.ts`

- [x] **POST `/payments/pix/send`** ✅ **IMPLEMENTADO**
  - Envía pago PIX (Brasil)
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ pixKey: string, amount: string (BRL), description?, merchantName?, account, reference? }`
  - Response: `{ success: true, data: { pixId, status, ts, fee?, endToEndId?, qrCode? } }`
  - **USADO EN:** `src/send/api/sendPIXPayment.ts`

- [x] **POST `/payments/pix/convert`** ✅ **IMPLEMENTADO**
  - Convierte crypto a BRL
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ amount: string, tokenId: string }`
  - Response: `{ success: true, data: { brlAmount: string, rate: number } }`
  - **USADO EN:** `src/send/api/sendPIXPayment.ts` (función `convertToBRL`)

- [x] **POST `/payments/mercado-pago/send`** ✅ **IMPLEMENTADO**
  - Envía pago Mercado Pago (Argentina, Brasil, etc.)
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ amount: string, currency?: string (default ARS), account }`
  - Response: `{ success: true, data: { paymentId, status, ts } }`
  - **USADO EN:** `src/send/api/sendMercadoPagoPayment.ts`

- [x] **POST `/payments/mercado-pago/convert`** ✅ **IMPLEMENTADO**
  - Convierte moneda local
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ amount: string, fromCurrency: string, toCurrency: string }`
  - Response: `{ success: true, data: { convertedAmount: string, rate: number } }`
  - **USADO EN:** `src/send/api/sendMercadoPagoPayment.ts` (función `convertToLocalCurrency`)

---

### ⛽ 6. Relayers (Gasless) (6 endpoints) ✅ COMPLETO (NUEVO)

- [x] **POST `/relayer/solana/quote`** ✅ **IMPLEMENTADO**
  - Obtiene quote para transacción gasless Solana
  - Response: `{ success: true, data: { estimatedGasUSD, rebateUSDC, sponsored } }`

- [x] **POST `/relayer/solana/submit`** ✅ **IMPLEMENTADO**
  - Envía transacción gasless Solana
  - Response: `{ success: true, data: { signature, txHash, status } }`

- [x] **GET `/relayer/solana/tx/:signature`** ✅ **IMPLEMENTADO**
  - Obtiene estado de transacción Solana
  - Response: `{ success: true, data: { signature, status, confirmations, slot } }`

- [x] **POST `/relayer/evm/quote`** ✅ **IMPLEMENTADO**
  - Obtiene quote para transacción gasless EVM
  - Response: `{ success: true, data: { estimatedGasUSD, rebateUSDC, sponsored } }`

- [x] **POST `/relayer/evm/submit`** ✅ **IMPLEMENTADO**
  - Envía transacción gasless EVM
  - Response: `{ success: true, data: { txHash, status } }`

- [x] **GET `/relayer/evm/tx/:txHash`** ✅ **IMPLEMENTADO**
  - Obtiene estado de transacción EVM
  - Response: `{ success: true, data: { txHash, status, confirmations, blockNumber } }`

---

### 📦 7. Accounts & Rotation (5 endpoints) ✅ COMPLETO (NUEVO)

- [x] **GET `/accounts`** ✅ **IMPLEMENTADO**
  - Lista cuentas del usuario (daily, savings, social)

- [x] **POST `/accounts`** ✅ **IMPLEMENTADO**
  - Crea nueva cuenta (lazy creation)

- [x] **GET `/accounts/:accountId/rotation/active`** ✅ **IMPLEMENTADO**
  - Obtiene dirección activa para rotación

- [x] **POST `/accounts/:accountId/rotation/rotate`** ✅ **IMPLEMENTADO**
  - Rota dirección activa

- [x] **POST `/accounts/:accountId/rotation/register-batch`** ✅ **IMPLEMENTADO**
  - Registra batch de direcciones (Solana principalmente)

---

### 🔔 8. Webhooks (2 endpoints - públicos) 🔴 PENDIENTE

- [ ] **POST `/webhooks/alchemy`** (EVM) 🔴 **PENDIENTE - CRÍTICO**
  - Webhook de Alchemy para ETH/Base/Polygon
  - Headers: `X-Alchemy-Signature` (verificación)
  - Body: Payload de Alchemy Notify
  - **Procesa:** Normaliza → evento dominio → actualiza Transfer status
  - **PRIORIDAD:** 🔴 Alta - Crítico para actualización automática de transacciones EVM

- [ ] **POST `/webhooks/helius`** (Solana) 🔴 **PENDIENTE - CRÍTICO**
  - Webhook de Helius para Solana
  - Headers: Verificación Helius
  - Body: Payload de Helius
  - **Procesa:** Normaliza → evento dominio → actualiza Transfer status
  - **PRIORIDAD:** 🔴 Alta - Crítico para actualización automática de transacciones Solana

---

### 📄 9. Proofs & Statements (3 endpoints) ✅ COMPLETO

- [x] **POST `/proofs`** ✅ **IMPLEMENTADO**
  - Crea proof de transacción
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ transferId, type: "payment" | "receipt" }`
  - Response: `{ success: true, data: { id, transferId, type, createdAt } }`

- [x] **GET `/proofs/:id`** ✅ **IMPLEMENTADO**
  - Obtiene proof
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { id, transferId, type, data, createdAt } }`

- [x] **GET `/statements`** ✅ **IMPLEMENTADO**
  - Obtiene statements mensuales
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Query: `?month=YYYY-MM&year=YYYY`
  - Response: `{ success: true, data: { month, statements: [...] } }`

---

### 📊 10. Plans/Limits (3 endpoints) ✅ COMPLETO

- [x] **GET `/plans`** ✅ **IMPLEMENTADO**
  - Lista planes disponibles
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { plans: [{ id, name, limits, gaslessMode }] } }`

- [x] **POST `/plans/activate`** ✅ **IMPLEMENTADO**
  - Activa plan para usuario
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ planId: string }`
  - Response: `{ success: true, data: { planId, activatedAt } }`

- [x] **GET `/limits`** ✅ **IMPLEMENTADO**
  - Obtiene límites del usuario (basado en plan)
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { plan, limits, remaining } }`

---

### 🔔 11. Notifications (2 endpoints) ✅ COMPLETO

- [x] **POST `/push/subscribe`** ✅ **IMPLEMENTADO**
  - Suscribe dispositivo a push notifications
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ token: string (FCM/expo token), platform: "ios"|"android"|"web" }`
  - Response: `{ success: true, data: { deviceTokenId, subscribedAt } }`

- [x] **DELETE `/push/unsubscribe`** ✅ **IMPLEMENTADO**
  - Desuscribe dispositivo
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Query: `?token=<deviceToken>`
  - Response: `{ success: true, data: { unsubscribed: true } }`

---

### 🔍 12. Search & Discovery (2 endpoints) ✅ COMPLETO

- [x] **GET `/search/users`** ✅ **IMPLEMENTADO**
  - Busca usuarios por alias o email
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Query: `?q=string`
  - Response: `{ success: true, data: { users: [{ id, alias, email }] } }`
  - **USADO PARA:** Buscar destinatarios en QuickSend

- [x] **GET `/search/tokens`** ✅ **IMPLEMENTADO**
  - Busca tokens por símbolo o nombre
  - Headers: `Authorization: Bearer <supabaseAccessToken>` (opcional)
  - Query: `?q=string`
  - Response: `{ success: true, data: { tokens: [{ symbol, name, chains }] } }`
  - **USADO PARA:** Token selector en QuickSend

---

### 📱 13. Contacts (3 endpoints) ✅ COMPLETO

- [x] **GET `/contacts`** ✅ **IMPLEMENTADO**
  - Lista contactos del usuario
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { contacts: [{ id, userId, name, address, chain, createdAt }] } }`

- [x] **POST `/contacts`** ✅ **IMPLEMENTADO**
  - Añade contacto
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ name: string, address: string, chain: string }`
  - Response: `{ success: true, data: { id, name, address, chain } }`

- [x] **DELETE `/contacts/:id`** ✅ **IMPLEMENTADO**
  - Elimina contacto
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { deleted: true } }`

---

### ⚙️ 14. Settings (3 endpoints) ✅ COMPLETO

- [x] **GET `/settings`** ✅ **IMPLEMENTADO**
  - Obtiene configuraciones del usuario
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { notifications, currency, language, twoFactorEnabled } }`

- [x] **PATCH `/settings`** ✅ **IMPLEMENTADO**
  - Actualiza configuraciones
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ notifications?, currency?, language? }`
  - Response: `{ success: true, data: { settings: {...} } }`

- [x] **GET `/settings/limits`** ✅ **IMPLEMENTADO**
  - Obtiene límites y fees según plan
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { plan, limits, fees } }`

---

### 🔒 15. Security & Sessions (4 endpoints) - 3/4 Implementados

- [x] **GET `/sessions`** ✅ **IMPLEMENTADO**
  - Lista sesiones activas del usuario
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { sessions: [...], totalActive } }`

- [x] **DELETE `/sessions/:id`** ✅ **IMPLEMENTADO**
  - Revoca sesión específica
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { revoked: true, message } }`

- [x] **POST `/sessions/revoke-all`** ✅ **IMPLEMENTADO**
  - Revoca todas las sesiones excepto la actual
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ password: string }` (confirmación requerida)
  - Response: `{ success: true, data: { revoked: number, message } }`

- [x] **GET `/security/pepper`** ✅ **IMPLEMENTADO**
  - Obtiene pepper del servidor para encriptación del vault
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { pepper, algorithm, version } }`

#### Extra Pendiente

- [ ] **GET `/sessions/current`** 🟡 **PENDIENTE - OPCIONAL**
  - Obtiene información de la sesión actual
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Response: `{ success: true, data: { session: {...} } }`
  - **PRIORIDAD:** 🟡 Media - Útil pero no crítico

---

### 📊 16. Analytics & Diagnostics (2 endpoints) ✅ COMPLETO

- [x] **GET `/diagnostics/payment`** ✅ **IMPLEMENTADO**
  - Diagnóstico de problemas de pago
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Query: `?tokenId=USDC&chain=solana&amount=100&to=address`
  - Response: `{ success: true, data: { canSend, issues, alternatives? } }`
  - **USADO EN:** `src/services/paymentDiagnostics.ts`

- [x] **POST `/analytics/event`** ✅ **IMPLEMENTADO**
  - Track eventos del frontend
  - Headers: `Authorization: Bearer <supabaseAccessToken>`
  - Body: `{ event: string, properties: {...}, timestamp? }`
  - Response: `{ success: true, data: { tracked: true } }`

---

### 🏥 17. Health & Metrics (3 endpoints) ✅ COMPLETO (NUEVO)

- [x] **GET `/health`** ✅ **IMPLEMENTADO**
  - Health check básico (público)
  - Response: `{ success: true, data: { status: "healthy", timestamp } }`

- [x] **GET `/health/full`** ✅ **IMPLEMENTADO**
  - Health check completo (dependencias)
  - Response: `{ success: true, data: { database, redis, solanaRpc, evmRpcs, memory } }`

- [x] **GET `/metrics`** ✅ **IMPLEMENTADO**
  - Métricas Prometheus (público)
  - Response: Texto plano (formato Prometheus)

---

### 📚 18. API Documentation (2 endpoints) ✅ COMPLETO (NUEVO)

- [x] **GET `/docs`** ✅ **IMPLEMENTADO**
  - Swagger UI - Documentación interactiva de la API
  - Acceso: `http://localhost:5000/api/v1/docs`

- [x] **GET `/docs/swagger.json`** ✅ **IMPLEMENTADO**
  - OpenAPI JSON spec
  - Response: JSON con especificación OpenAPI 3.0

---

## 📝 RESUMEN DE CONTEO

### Endpoints Implementados: **58/70 (83%)**

#### ✅ Completamente Implementados:
- Auth & Users: 10/10 ✅
- Passkeys: 6/6 ✅
- Wallets: 4/4 ✅
- Balances & Prices: 3/3 ✅
- Transfers: 4/6 (faltan 2 opcionales)
- Payments: 6/6 ✅
- Relayers (Gasless): 6/6 ✅ **NUEVO**
- Accounts & Rotation: 5/5 ✅ **NUEVO**
- Search & Discovery: 2/2 ✅
- Contacts: 3/3 ✅
- Settings: 3/3 ✅
- Security & Sessions: 4/5 (falta 1 opcional)
- Plans & Limits: 3/3 ✅
- Notifications: 2/2 ✅
- Proofs & Statements: 3/3 ✅
- Analytics & Diagnostics: 2/2 ✅
- Health & Metrics: 3/3 ✅ **NUEVO**
- API Documentation: 2/2 ✅ **NUEVO**

#### ⏳ Pendientes:
- **Alias: 0/2** 🔴 CRÍTICO
- **Webhooks: 0/2** 🔴 CRÍTICO
- **Transfers Extras: 0/2** 🟡 OPCIONAL
- **Sessions Extra: 0/1** 🟡 OPCIONAL

### **TOTAL: 70 endpoints** (58 implementados + 12 pendientes)

---

## 🎯 ESTADO ACTUAL Y PRIORIZACIÓN

### ✅ **COMPLETADO (Phase 0-4):**
- ✅ Auth & Users completo (10 endpoints)
- ✅ Passkeys completo (6 endpoints)
- ✅ Wallets completo (4 endpoints)
- ✅ Balances & Prices completo (3 endpoints)
- ✅ Transfers core completo (4 endpoints)
- ✅ Payments completo (6 endpoints)
- ✅ Relayers (Gasless) completo (6 endpoints) **NUEVO**
- ✅ Accounts & Rotation completo (5 endpoints) **NUEVO**
- ✅ Search & Discovery completo (2 endpoints)
- ✅ Contacts completo (3 endpoints)
- ✅ Settings completo (3 endpoints)
- ✅ Security & Sessions (4/5 endpoints)
- ✅ Plans & Limits completo (3 endpoints)
- ✅ Notifications completo (2 endpoints)
- ✅ Proofs & Statements completo (3 endpoints)
- ✅ Analytics & Diagnostics completo (2 endpoints)
- ✅ Health & Metrics completo (3 endpoints) **NUEVO**
- ✅ API Documentation completo (2 endpoints) **NUEVO**

### 🔴 **PENDIENTE CRÍTICO (MVP Bloqueante):**
1. **Alias System (2 endpoints)** - 🔴 CRÍTICO
   - POST `/alias` - Crear/actualizar alias
   - GET `/alias/resolve/:alias` - Resolver `@username`
   - **Impacto:** Bloquea feature de alias `@username`
   - **Estimación:** 1 día

2. **Webhooks (2 endpoints)** - 🔴 CRÍTICO
   - POST `/webhooks/alchemy` - Actualización automática transacciones EVM
   - POST `/webhooks/helius` - Actualización automática transacciones Solana
   - **Impacto:** Sin estos, las transacciones no se actualizan automáticamente
   - **Estimación:** 1-2 días

### 🟡 **PENDIENTE OPCIONAL (Mejoras UX):**
3. **Transfers Extras (2 endpoints)** - 🟡 OPCIONAL
   - GET `/transfers/:id/details` - Detalles extendidos
   - GET `/transfers/summary` - Estadísticas de actividad
   - **Impacto:** Mejora UX pero no bloqueante
   - **Estimación:** 1 día

4. **Sessions Extra (1 endpoint)** - 🟡 OPCIONAL
   - GET `/sessions/current` - Información de sesión actual
   - **Impacto:** Útil pero no crítico
   - **Estimación:** 0.5 días

---

## 🔧 NOTAS TÉCNICAS

### Autenticación (Supabase)

**Tokens:**
- Todos los endpoints protegidos usan: `Authorization: Bearer <supabaseAccessToken>`
- Supabase Access Token es un JWT que se verifica con la clave pública de Supabase
- El token contiene: `sub` (user ID), `email`, `metadata`, `exp`, etc.

**Verificación en Backend:**
```typescript
// Opción 1: Usar @supabase/supabase-js (recomendado)
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// En guard NestJS
const { data: { user }, error } = await supabase.auth.getUser(accessToken);

// Opción 2: Verificar JWT manualmente
import jwt from 'jsonwebtoken';
const decoded = jwt.verify(accessToken, SUPABASE_JWT_SECRET);
```

**User disponible en `req.user` después del guard:**
```typescript
{
  id: string,           // Supabase user ID (UUID)
  email: string,
  supabaseUid: string, // Mismo que id
  metadata?: object,
  provider?: 'email' | 'google' | 'apple' | 'passkey'
}
```

**Refresh Tokens:**
- Los refresh tokens se manejan principalmente en el frontend
- Backend puede refrescar usando `supabase.auth.refreshSession(refreshToken)` si es necesario

**Passkeys:**
- Ver `BACKEND_IMPLEMENTATION_GUIDE.md` para implementación completa
- Los passkeys se autentican vía WebAuthn y retornan sesión de Supabase
- No requieren token adicional, la sesión se crea después de verificar el passkey

### Rate Limiting
- `/transfers/submit`, `/payments/*`: Más estricto (IP + user)
- `/balances`, `/prices`: Cache + rate limit moderado
- `/webhooks/*`: Solo verificación de firma, sin rate limit

### Idempotency
- POST endpoints mutantes deberían aceptar `Idempotency-Key` header
- Usar constraints únicos en DB (userId + idempotencyKey)

### Caching
- Balances: Redis 15-60s (key: `balance:${userId}:${chain}:${account}`)
- Prices: Redis 30-60s (key: `price:${symbol}:${fiat}`)
- Alias resolves: Redis 5-10min (key: `alias:${alias}`)

### Error Responses
- Formato estándar: `{ error: { code: string, message: string, details?: any } }`
- Status codes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 429 (rate limit), 500 (server error)

---

## ✅ VALIDACIÓN FINAL

Antes de deploy a producción, verificar:
- [ ] Todos los endpoints tienen validación Zod (DTOs)
- [ ] Rate limiting configurado
- [ ] Idempotency keys en POST mutantes
- [ ] Error handling consistente
- [ ] Logging (Sentry + OpenTelemetry)
- [ ] Tests unitarios + e2e para endpoints críticos
- [ ] OpenAPI/Swagger docs generados
- [ ] Health check endpoint: `GET /health`

---

**Última revisión:** 2024-11-02 - Actualizado según implementación real  
**Estado:** 🟢 **83% Completado** (58/70 endpoints implementados)

**Próximos pasos críticos:**
1. 🔴 Implementar endpoints de Alias (2 endpoints) - 1 día
2. 🔴 Implementar Webhooks (2 endpoints) - 1-2 días
3. 🟡 Endpoints opcionales de detalles/estadísticas (3 endpoints) - 1.5 días

> **Ver:** `BACKEND_ENDPOINTS_STATUS.md` para estado detallado y lista completa de pendientes

---

## 📚 Referencias

- **Supabase Auth:** Ver documentación oficial de Supabase
- **Passkeys Implementation:** Ver [`BACKEND_IMPLEMENTATION_GUIDE.md`](./BACKEND_IMPLEMENTATION_GUIDE.md)
- **Supabase JWT Secret:** Obtener desde Supabase Dashboard → Settings → API → JWT Secret
- **Service Role Key:** Obtener desde Supabase Dashboard → Settings → API → service_role key (solo para backend)

