# 🧪 Testing Completo Pre-Lanzamiento - HiHODL

**Fecha:** 2024-11-02  
**Objetivo:** Verificar que TODAS las funcionalidades funcionen correctamente antes del lanzamiento  
**Prioridad:** 🔴 **CRÍTICO** - No lanzar sin completar este checklist

---

## 📋 Índice

1. [Configuración y Variables de Entorno](#1-configuración-y-variables-de-entorno)
2. [Testing de APIs - Conexión Backend](#2-testing-de-apis---conexión-backend)
3. [Testing de Flujos de Autenticación](#3-testing-de-flujos-de-autenticación)
4. [Testing de Flujos de Pago (CRÍTICO)](#4-testing-de-flujos-de-pago-crítico)
5. [Testing de Wallets y Balances](#5-testing-de-wallets-y-balances)
6. [Testing de Transfers](#6-testing-de-transfers)
7. [Testing de Workflows Completos](#7-testing-de-workflows-completos)
8. [Testing de UI/UX](#8-testing-de-uiux)
9. [Testing de Edge Cases y Errores](#9-testing-de-edge-cases-y-errores)

---

## 1. Configuración y Variables de Entorno

### ✅ Checklist de Configuración

- [ ] **Verificar `EXPO_PUBLIC_API_URL`**
  - [ ] Variable configurada en `.env` o EAS Secrets
  - [ ] URL correcta: `https://api.hihodl.xyz/api/v1` (producción) o `http://localhost:5000/api/v1` (desarrollo)
  - [ ] Sin trailing slash al final
  - [ ] Verificar en runtime: `src/config/runtime.ts` lee correctamente

- [ ] **Verificar Supabase**
  - [ ] `EXPO_PUBLIC_SUPABASE_URL` configurado
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` configurado
  - [ ] Conexión a Supabase funciona

- [ ] **Verificar Privy**
  - [ ] `EXPO_PUBLIC_PRIVY_APP_ID` configurado
  - [ ] Privy inicializa correctamente

- [ ] **Verificar Mixpanel (Analytics)**
  - [ ] `EXPO_PUBLIC_MIXPANEL_TOKEN` configurado (si aplica)

### 🔍 Verificación Rápida

```bash
# Verificar variables de entorno
npx expo config --type public | grep EXPO_PUBLIC

# Verificar que la app puede leer las variables
# Abrir la app y verificar en logs que API_URL está configurado
```

---

## 2. Testing de APIs - Conexión Backend

### 🔐 Auth & Users (10 endpoints)

#### POST `/auth/supabase`
- [ ] **Test:** Verificar token de Supabase
  - [ ] Login con Supabase
  - [ ] Llamar a `/auth/supabase` con token
  - [ ] Verificar respuesta: `{ success: true, data: { token, user } }`
  - [ ] Verificar que el usuario se crea/actualiza correctamente

#### POST `/auth/refresh`
- [ ] **Test:** Refrescar token
  - [ ] Obtener refresh token de Supabase
  - [ ] Llamar a `/auth/refresh` con refresh token
  - [ ] Verificar respuesta: `{ success: true, data: { accessToken, refreshToken } }`

#### GET `/me`
- [ ] **Test:** Obtener perfil del usuario
  - [ ] Llamar a `/me` con token válido
  - [ ] Verificar respuesta incluye: `id`, `email`, `profile`
  - [ ] Verificar que el plan del usuario se muestra correctamente

#### PATCH `/me`
- [ ] **Test:** Actualizar perfil
  - [ ] Actualizar `displayName`
  - [ ] Actualizar `country`
  - [ ] Verificar cambios se reflejan en `/me`

#### Passkeys (6 endpoints)
- [ ] **POST `/passkeys/register/begin`** - Iniciar registro
- [ ] **POST `/passkeys/register/complete`** - Completar registro
- [ ] **POST `/passkeys/login/begin`** - Iniciar login
- [ ] **POST `/passkeys/login/complete`** - Completar login
- [ ] **GET `/passkeys/list`** - Listar passkeys
- [ ] **DELETE `/passkeys/:id`** - Eliminar passkey

### 💼 Wallets (4 endpoints)

#### POST `/wallets/link`
- [ ] **Test:** Vincular wallet externa
  - [ ] Vincular wallet Ethereum
  - [ ] Vincular wallet Base
  - [ ] Vincular wallet Polygon
  - [ ] Vincular wallet Solana
  - [ ] Verificar que se guarda correctamente

#### GET `/wallets`
- [ ] **Test:** Listar wallets
  - [ ] Verificar que muestra todas las wallets vinculadas
  - [ ] Filtrar por chain: `?chains=eth,base`
  - [ ] Verificar formato de respuesta

#### GET `/wallets/:walletId/receive-address`
- [ ] **Test:** Obtener dirección de recepción
  - [ ] Para Ethereum: `?chain=eth&account=daily`
  - [ ] Para Solana: `?chain=sol&account=savings`
  - [ ] Verificar que retorna dirección válida
  - [ ] Verificar política de reutilización

#### POST `/wallets/:walletId/addresses/batch`
- [ ] **Test:** Provisionar batch de direcciones (Solana)
  - [ ] Provisionar 5 direcciones
  - [ ] Verificar que se crean correctamente

### 💰 Balances & Prices (3 endpoints)

#### GET `/balances`
- [ ] **Test:** Obtener balances
  - [ ] Verificar que muestra balances de todas las chains
  - [ ] Verificar formato: `{ tokenId: { chain: balance } }`
  - [ ] Verificar que balances son números válidos

#### GET `/prices`
- [ ] **Test:** Obtener precios
  - [ ] Verificar precios de tokens principales (USDC, USDT, etc.)
  - [ ] Verificar formato de respuesta

#### GET `/prices/history`
- [ ] **Test:** Historial de precios
  - [ ] Obtener historial de USDC
  - [ ] Verificar formato de datos históricos

### 📤 Transfers (6 endpoints)

#### POST `/transfers/quote`
- [ ] **Test:** Obtener quote de transferencia
  - [ ] Quote para USDC en Ethereum
  - [ ] Quote para USDC en Solana
  - [ ] Verificar que incluye fees estimados
  - [ ] Verificar tiempo estimado

#### POST `/transfers/submit`
- [ ] **Test:** Enviar transferencia
  - [ ] Enviar USDC en Ethereum
  - [ ] Enviar USDC en Solana
  - [ ] Verificar respuesta: `{ txId, status, ts }`
  - [ ] Verificar que se crea idempotency key

#### GET `/transfers/:id`
- [ ] **Test:** Obtener estado de transferencia
  - [ ] Obtener transferencia por ID
  - [ ] Verificar estado: `pending`, `confirmed`, `failed`
  - [ ] Verificar que incluye información completa

#### GET `/transfers/:id/details`
- [ ] **Test:** Detalles completos de transferencia
  - [ ] Verificar que incluye todos los detalles
  - [ ] Verificar información de blockchain

#### GET `/transfers`
- [ ] **Test:** Listar transferencias
  - [ ] Listar todas las transferencias
  - [ ] Filtrar por chain: `?chain=eth`
  - [ ] Filtrar por status: `?status=confirmed`
  - [ ] Paginación: `?limit=10&offset=0`

#### GET `/transfers/summary`
- [ ] **Test:** Resumen de transferencias
  - [ ] Resumen de últimos 7 días
  - [ ] Resumen de últimos 30 días
  - [ ] Verificar estadísticas

---

## 4. Testing de Flujos de Pago (CRÍTICO) 🔴

### 💳 Pagos Crypto (POST `/payments/send`)

#### Flujo Completo de Pago Crypto

1. **Preparación**
   - [ ] Usuario tiene balance suficiente
   - [ ] Token seleccionado (USDC, USDT, etc.)
   - [ ] Chain seleccionada (eth, base, polygon, sol)
   - [ ] Cuenta seleccionada (daily, savings, social)

2. **Envío de Pago**
   - [ ] **Test:** Pago a usuario HiHODL (por alias)
     - [ ] Ingresar alias: `@usuario`
     - [ ] Seleccionar token y chain
     - [ ] Ingresar cantidad
     - [ ] Enviar pago
     - [ ] Verificar que se llama a `/payments/send`
     - [ ] Verificar respuesta: `{ txId, status: "pending" }`
     - [ ] Verificar que se muestra confirmación

   - [ ] **Test:** Pago a wallet externa (por dirección)
     - [ ] Ingresar dirección: `0x...` o `So1...`
     - [ ] Seleccionar token y chain
     - [ ] Ingresar cantidad
     - [ ] Confirmar en pantalla de confirmación
     - [ ] Enviar pago
     - [ ] Verificar que se llama a `/payments/send`
     - [ ] Verificar respuesta exitosa

3. **Validaciones**
   - [ ] **Test:** Balance insuficiente
     - [ ] Intentar enviar más de lo disponible
     - [ ] Verificar mensaje de error apropiado
     - [ ] Verificar que no se envía el pago

   - [ ] **Test:** Cantidad inválida
     - [ ] Intentar enviar 0
     - [ ] Intentar enviar cantidad negativa
     - [ ] Verificar validación

   - [ ] **Test:** Auto-bridge
     - [ ] Token disponible en otra chain
     - [ ] Verificar que se sugiere auto-bridge
     - [ ] Verificar que funciona el auto-bridge

4. **Post-Pago**
   - [ ] **Test:** Verificar estado del pago
     - [ ] Obtener estado con `/transfers/:id`
     - [ ] Verificar que cambia de `pending` a `confirmed`
     - [ ] Verificar que se actualiza el balance

### 🇧🇷 Pagos PIX (POST `/payments/pix/send`)

#### Flujo Completo de Pago PIX

1. **Preparación**
   - [ ] Usuario tiene balance en crypto
   - [ ] Token seleccionado (se convertirá a BRL)
   - [ ] Datos PIX disponibles:
     - [ ] PIX Key (CPF, email, teléfono, aleatoria)
     - [ ] Merchant name (opcional)
     - [ ] Description (opcional)

2. **Conversión a BRL**
   - [ ] **Test:** Convertir crypto a BRL
     - [ ] Llamar a `/payments/pix/convert`
     - [ ] Verificar respuesta: `{ brlAmount, rate }`
     - [ ] Verificar que el rate es razonable
     - [ ] Verificar que se muestra el monto en BRL

3. **Envío de Pago PIX**
   - [ ] **Test:** Enviar pago PIX
     - [ ] Ingresar PIX key
     - [ ] Seleccionar token
     - [ ] Ingresar cantidad (en crypto)
     - [ ] Ver conversión a BRL
     - [ ] Enviar pago
     - [ ] Verificar que se llama a `/payments/pix/send`
     - [ ] Verificar respuesta: `{ pixId, status, ts, fee? }`
     - [ ] Verificar que se muestra confirmación

4. **Validaciones**
   - [ ] **Test:** PIX key inválida
     - [ ] Intentar con PIX key mal formateada
     - [ ] Verificar mensaje de error

   - [ ] **Test:** Balance insuficiente
     - [ ] Intentar enviar más de lo disponible
     - [ ] Verificar validación

5. **Post-Pago**
   - [ ] **Test:** Verificar estado
     - [ ] Verificar que el pago se procesa
     - [ ] Verificar que se actualiza el balance

### 🇦🇷 Pagos Mercado Pago (POST `/payments/mercado-pago/send`)

#### Flujo Completo de Pago Mercado Pago

1. **Preparación**
   - [ ] Usuario tiene balance en crypto
   - [ ] Token seleccionado
   - [ ] Datos Mercado Pago:
     - [ ] Mercado Pago ID
     - [ ] Currency (ARS, BRL, etc.)
     - [ ] Merchant name (opcional)
     - [ ] Description (opcional)

2. **Conversión de Moneda**
   - [ ] **Test:** Convertir crypto a moneda local
     - [ ] Llamar a `/payments/mercado-pago/convert`
     - [ ] Verificar respuesta: `{ localAmount, rate }`
     - [ ] Verificar rate para ARS
     - [ ] Verificar rate para BRL

3. **Envío de Pago Mercado Pago**
   - [ ] **Test:** Enviar pago Mercado Pago
     - [ ] Ingresar Mercado Pago ID
     - [ ] Seleccionar currency (ARS)
     - [ ] Seleccionar token
     - [ ] Ingresar cantidad (en crypto)
     - [ ] Ver conversión a ARS
     - [ ] Enviar pago
     - [ ] Verificar que se llama a `/payments/mercado-pago/send`
     - [ ] Verificar respuesta: `{ paymentId, status, ts }`
     - [ ] Verificar que se muestra confirmación

4. **Validaciones**
   - [ ] **Test:** Mercado Pago ID inválido
     - [ ] Intentar con ID mal formateado
     - [ ] Verificar mensaje de error

   - [ ] **Test:** Balance insuficiente
     - [ ] Verificar validación

5. **Post-Pago**
   - [ ] **Test:** Verificar estado
     - [ ] Verificar que el pago se procesa
     - [ ] Verificar que se actualiza el balance

### 📝 Solicitar Pago (POST `/payments/request`)

- [ ] **Test:** Crear solicitud de pago
  - [ ] Crear solicitud desde usuario A a usuario B
  - [ ] Verificar que se llama a `/payments/request`
  - [ ] Verificar respuesta: `{ requestId, status: "requested" }`
  - [ ] Verificar que usuario B ve la solicitud
  - [ ] Usuario B acepta y paga
  - [ ] Verificar que se actualiza el estado

---

## 5. Testing de Wallets y Balances

### 💼 Wallets

- [ ] **Test:** Crear/vincular wallet
  - [ ] Vincular wallet Ethereum
  - [ ] Vincular wallet Solana
  - [ ] Verificar que aparece en lista

- [ ] **Test:** Obtener dirección de recepción
  - [ ] Para Ethereum (daily account)
  - [ ] Para Solana (savings account)
  - [ ] Verificar que la dirección es válida
  - [ ] Verificar QR code se genera correctamente

- [ ] **Test:** Provisionar direcciones batch (Solana)
  - [ ] Provisionar 5 direcciones
  - [ ] Verificar que se crean correctamente

### 💰 Balances

- [ ] **Test:** Cargar balances
  - [ ] Verificar que se cargan balances de todas las chains
  - [ ] Verificar que se actualizan automáticamente
  - [ ] Verificar formato de visualización

- [ ] **Test:** Balance por cuenta
  - [ ] Verificar balance en Daily account
  - [ ] Verificar balance en Savings account
  - [ ] Verificar balance en Social account

- [ ] **Test:** Balance después de transacción
  - [ ] Enviar pago
  - [ ] Verificar que el balance se actualiza
  - [ ] Verificar que el balance es correcto

---

## 6. Testing de Transfers

### 📤 Envío de Transferencias

- [ ] **Test:** Transferencia simple
  - [ ] Enviar USDC en Ethereum
  - [ ] Verificar quote antes de enviar
  - [ ] Enviar transferencia
  - [ ] Verificar estado inicial: `pending`
  - [ ] Esperar confirmación
  - [ ] Verificar estado final: `confirmed`

- [ ] **Test:** Transferencia cross-chain
  - [ ] Enviar de Ethereum a Base
  - [ ] Verificar que se usa bridge
  - [ ] Verificar que se completa

- [ ] **Test:** Transferencia con memo (Solana)
  - [ ] Enviar USDC en Solana con memo
  - [ ] Verificar que el memo se incluye

### 📥 Recepción de Transferencias

- [ ] **Test:** Recibir transferencia
  - [ ] Generar dirección de recepción
  - [ ] Enviar desde otra wallet
  - [ ] Verificar que aparece en historial
  - [ ] Verificar que el balance se actualiza

### 📊 Historial de Transferencias

- [ ] **Test:** Ver historial
  - [ ] Ver todas las transferencias
  - [ ] Filtrar por chain
  - [ ] Filtrar por status
  - [ ] Ver detalles de una transferencia

---

## 7. Testing de Workflows Completos

### 🔄 Workflow 1: Onboarding Completo

1. **Registro**
   - [ ] Crear cuenta nueva
   - [ ] Verificar email
   - [ ] Configurar username
   - [ ] Configurar PIN
   - [ ] Configurar seguridad (biométrica/passkey)

2. **Configuración Inicial**
   - [ ] Seleccionar cuenta principal
   - [ ] Configurar notificaciones
   - [ ] Completar onboarding

3. **Primera Wallet**
   - [ ] Crear/vincular primera wallet
   - [ ] Obtener dirección de recepción
   - [ ] Recibir primeros fondos

### 🔄 Workflow 2: Envío de Pago Completo

1. **Preparación**
   - [ ] Usuario tiene balance
   - [ ] Contacto agregado (opcional)

2. **Envío**
   - [ ] Seleccionar destinatario (alias o dirección)
   - [ ] Seleccionar token y chain
   - [ ] Ingresar cantidad
   - [ ] Seleccionar cuenta
   - [ ] Confirmar y enviar

3. **Verificación**
   - [ ] Ver confirmación de envío
   - [ ] Ver estado del pago
   - [ ] Verificar que aparece en historial
   - [ ] Verificar que el balance se actualiza

### 🔄 Workflow 3: Pago PIX Completo

1. **Preparación**
   - [ ] Usuario tiene balance en crypto
   - [ ] Datos PIX del destinatario

2. **Conversión y Envío**
   - [ ] Seleccionar token
   - [ ] Ver conversión a BRL
   - [ ] Confirmar y enviar
   - [ ] Ver confirmación

3. **Verificación**
   - [ ] Verificar que el pago se procesa
   - [ ] Verificar que se actualiza el balance

### 🔄 Workflow 4: Solicitar y Pagar

1. **Solicitar Pago**
   - [ ] Usuario A solicita pago a Usuario B
   - [ ] Usuario B ve la solicitud

2. **Pagar Solicitud**
   - [ ] Usuario B acepta la solicitud
   - [ ] Selecciona token y cuenta
   - [ ] Confirma y paga

3. **Verificación**
   - [ ] Verificar que el pago se completa
   - [ ] Verificar que ambos usuarios ven la transacción

### 🔄 Workflow 5: Cambio de Plan

1. **Seleccionar Plan**
   - [ ] Ir a pantalla de planes
   - [ ] Ver plan actual
   - [ ] Seleccionar nuevo plan

2. **Checkout**
   - [ ] Ver detalles del plan
   - [ ] Completar checkout (si requiere pago)
   - [ ] Confirmar cambio

3. **Verificación**
   - [ ] Verificar que el plan se actualiza
   - [ ] Verificar que los límites se actualizan
   - [ ] Verificar en `/me` que el plan cambió

---

## 8. Testing de UI/UX

### 🎨 Navegación

- [ ] **Test:** Navegación entre pantallas
  - [ ] Home → Send
  - [ ] Home → Receive
  - [ ] Home → Payments
  - [ ] Home → Settings
  - [ ] Verificar que no hay crashes

### 📱 Pantallas Principales

- [ ] **Test:** Dashboard/Home
  - [ ] Carga correctamente
  - [ ] Muestra balances
  - [ ] Muestra tokens
  - [ ] Muestra transacciones recientes
  - [ ] Navegación funciona

- [ ] **Test:** Send Screen
  - [ ] Carga correctamente
  - [ ] Selector de token funciona
  - [ ] Selector de chain funciona
  - [ ] Input de cantidad funciona
  - [ ] Validaciones funcionan
  - [ ] Botón de envío funciona

- [ ] **Test:** Receive Screen
  - [ ] Genera dirección correctamente
  - [ ] QR code se muestra correctamente
  - [ ] Copiar dirección funciona
  - [ ] Compartir funciona

- [ ] **Test:** Payments Screen
  - [ ] Lista de pagos se carga
  - [ ] Crear nuevo pago funciona
  - [ ] Ver detalles de pago funciona

### 🔔 Notificaciones

- [ ] **Test:** Notificaciones push
  - [ ] Recibir notificación de pago recibido
  - [ ] Recibir notificación de pago enviado
  - [ ] Abrir notificación navega correctamente

### 🌐 Internacionalización

- [ ] **Test:** Cambio de idioma
  - [ ] Cambiar a español
  - [ ] Cambiar a inglés
  - [ ] Verificar que todos los textos se traducen

---

## 9. Testing de Edge Cases y Errores

### ❌ Errores de Red

- [ ] **Test:** Sin conexión a internet
  - [ ] Desactivar WiFi/datos
  - [ ] Intentar enviar pago
  - [ ] Verificar mensaje de error apropiado
  - [ ] Reactivar conexión
  - [ ] Verificar que se recupera automáticamente

- [ ] **Test:** Timeout de API
  - [ ] Simular timeout
  - [ ] Verificar manejo de error
  - [ ] Verificar que se puede reintentar

### ❌ Errores de API

- [ ] **Test:** Error 401 (No autorizado)
  - [ ] Token expirado
  - [ ] Verificar que se refresca automáticamente
  - [ ] Verificar que se redirige a login si es necesario

- [ ] **Test:** Error 400 (Bad Request)
  - [ ] Enviar datos inválidos
  - [ ] Verificar mensaje de error claro

- [ ] **Test:** Error 500 (Server Error)
  - [ ] Simular error del servidor
  - [ ] Verificar mensaje de error apropiado
  - [ ] Verificar que se puede reintentar

### ⚠️ Edge Cases

- [ ] **Test:** Balance exacto
  - [ ] Enviar exactamente el balance disponible
  - [ ] Verificar que funciona (considerando fees)

- [ ] **Test:** Cantidad muy pequeña
  - [ ] Enviar 0.000001 USDC
  - [ ] Verificar validación

- [ ] **Test:** Cantidad muy grande
  - [ ] Intentar enviar cantidad excesiva
  - [ ] Verificar validación

- [ ] **Test:** Múltiples pagos simultáneos
  - [ ] Enviar 3 pagos al mismo tiempo
  - [ ] Verificar que todos se procesan
  - [ ] Verificar que no hay conflictos

- [ ] **Test:** Pago a dirección inválida
  - [ ] Intentar enviar a dirección mal formateada
  - [ ] Verificar validación

- [ ] **Test:** Pago a alias inexistente
  - [ ] Intentar enviar a `@usuario_inexistente`
  - [ ] Verificar mensaje de error

---

## 📊 Resumen de Testing

### Estadísticas

- **Total de Tests:** ~150+
- **Tests Críticos (Pagos):** ~40
- **Tests de APIs:** ~60
- **Tests de Workflows:** ~20
- **Tests de UI/UX:** ~15
- **Tests de Edge Cases:** ~15

### Prioridades

1. 🔴 **CRÍTICO:** Flujos de pago (crypto, PIX, Mercado Pago)
2. 🟠 **ALTO:** APIs de autenticación y wallets
3. 🟡 **MEDIO:** Workflows completos
4. 🟢 **BAJO:** UI/UX y edge cases

---

## ✅ Checklist Final Pre-Lanzamiento

Antes de lanzar, verificar:

- [ ] ✅ Todos los tests de pagos pasan
- [ ] ✅ Todas las APIs están conectadas
- [ ] ✅ Todos los workflows funcionan end-to-end
- [ ] ✅ No hay crashes conocidos
- [ ] ✅ Errores se manejan correctamente
- [ ] ✅ UI/UX es fluida
- [ ] ✅ Performance es aceptable
- [ ] ✅ No hay errores en consola (críticos)
- [ ] ✅ Variables de entorno configuradas correctamente
- [ ] ✅ Backend está en producción y funcionando

---

## 🚀 Siguiente Paso

Una vez completado este checklist:

1. Revisar cualquier issue encontrado
2. Corregir bugs críticos
3. Re-testear funcionalidades corregidas
4. Preparar para lanzamiento

---

**Última actualización:** 2024-11-02  
**Estado:** 🟡 En progreso



