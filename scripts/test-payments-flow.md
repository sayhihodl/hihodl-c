# 🧪 Guía de Testing Manual - Flujos de Pago

Esta guía te ayudará a testear manualmente todos los flujos de pago antes del lanzamiento.

## 📋 Preparación

1. **Configurar entorno de desarrollo:**
   ```bash
   # Verificar que EXPO_PUBLIC_API_URL está configurado
   npx expo config --type public | grep EXPO_PUBLIC_API_URL
   ```

2. **Iniciar la app:**
   ```bash
   npm start
   # o
   npx expo start
   ```

3. **Tener dos cuentas de prueba:**
   - Usuario A: Para enviar pagos
   - Usuario B: Para recibir pagos

---

## 💳 Test 1: Pago Crypto a Usuario HiHODL

### Pasos:

1. **Login como Usuario A**
   - [ ] Login exitoso
   - [ ] Dashboard carga correctamente
   - [ ] Balance visible

2. **Navegar a Send**
   - [ ] Ir a pantalla de envío
   - [ ] Verificar que carga correctamente

3. **Seleccionar Destinatario**
   - [ ] Buscar usuario por alias: `@usuario_b`
   - [ ] Verificar que aparece el usuario
   - [ ] Seleccionar usuario

4. **Configurar Pago**
   - [ ] Seleccionar token: USDC
   - [ ] Seleccionar chain: Ethereum
   - [ ] Seleccionar cuenta: Daily
   - [ ] Ingresar cantidad: 10 USDC

5. **Enviar Pago**
   - [ ] Verificar que el botón "Send" está habilitado
   - [ ] Presionar "Send"
   - [ ] Verificar que se muestra loading
   - [ ] Verificar que aparece confirmación

6. **Verificar Resultado**
   - [ ] Verificar que el pago aparece en historial
   - [ ] Verificar que el balance se actualiza
   - [ ] Login como Usuario B
   - [ ] Verificar que Usuario B recibió el pago

### ✅ Criterios de Éxito:
- [ ] Pago se envía sin errores
- [ ] Balance se actualiza correctamente
- [ ] Usuario B recibe el pago
- [ ] Aparece en historial de ambos usuarios

---

## 💳 Test 2: Pago Crypto a Wallet Externa

### Pasos:

1. **Preparación**
   - [ ] Login como Usuario A
   - [ ] Tener dirección de wallet externa (Ethereum)

2. **Configurar Pago**
   - [ ] Ir a Send
   - [ ] Ingresar dirección: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
   - [ ] Seleccionar token: USDC
   - [ ] Seleccionar chain: Ethereum
   - [ ] Ingresar cantidad: 5 USDC

3. **Confirmar Pago**
   - [ ] Verificar que aparece pantalla de confirmación
   - [ ] Verificar detalles del pago
   - [ ] Confirmar pago

4. **Verificar Resultado**
   - [ ] Verificar que el pago se envía
   - [ ] Verificar que aparece en historial
   - [ ] Verificar que el balance se actualiza
   - [ ] Verificar en blockchain explorer que la transacción existe

### ✅ Criterios de Éxito:
- [ ] Pago se envía correctamente
- [ ] Transacción aparece en blockchain
- [ ] Balance se actualiza
- [ ] Historial se actualiza

---

## 🇧🇷 Test 3: Pago PIX

### Pasos:

1. **Preparación**
   - [ ] Login como Usuario A
   - [ ] Tener balance en crypto (USDC)
   - [ ] Tener datos PIX del destinatario:
     - PIX Key: `12345678900` (CPF de ejemplo)
     - Merchant Name: `Test Merchant`

2. **Navegar a Pago PIX**
   - [ ] Ir a Payments
   - [ ] Seleccionar opción PIX
   - [ ] O navegar directamente con parámetros PIX

3. **Configurar Pago PIX**
   - [ ] Verificar que aparece pantalla de pago PIX
   - [ ] Verificar que muestra PIX Key
   - [ ] Seleccionar token: USDC
   - [ ] Ingresar cantidad: 100 USDC

4. **Ver Conversión a BRL**
   - [ ] Verificar que se muestra conversión a BRL
   - [ ] Verificar que el rate es razonable
   - [ ] Verificar monto en BRL

5. **Enviar Pago**
   - [ ] Presionar "Send"
   - [ ] Verificar loading
   - [ ] Verificar confirmación

6. **Verificar Resultado**
   - [ ] Verificar que el pago se procesa
   - [ ] Verificar que aparece en historial
   - [ ] Verificar que el balance se actualiza

### ✅ Criterios de Éxito:
- [ ] Conversión a BRL funciona
- [ ] Pago PIX se envía correctamente
- [ ] Balance se actualiza
- [ ] Historial se actualiza

---

## 🇦🇷 Test 4: Pago Mercado Pago

### Pasos:

1. **Preparación**
   - [ ] Login como Usuario A
   - [ ] Tener balance en crypto
   - [ ] Tener datos Mercado Pago:
     - Mercado Pago ID: `test_mp_id_123`
     - Currency: ARS

2. **Navegar a Pago Mercado Pago**
   - [ ] Ir a Payments
   - [ ] Seleccionar opción Mercado Pago

3. **Configurar Pago**
   - [ ] Verificar que muestra Mercado Pago ID
   - [ ] Seleccionar token: USDC
   - [ ] Ingresar cantidad: 50 USDC

4. **Ver Conversión a ARS**
   - [ ] Verificar conversión a ARS
   - [ ] Verificar rate

5. **Enviar Pago**
   - [ ] Presionar "Send"
   - [ ] Verificar confirmación

6. **Verificar Resultado**
   - [ ] Verificar que el pago se procesa
   - [ ] Verificar balance actualizado

### ✅ Criterios de Éxito:
- [ ] Conversión a ARS funciona
- [ ] Pago Mercado Pago se envía
- [ ] Balance se actualiza

---

## 📝 Test 5: Solicitar Pago

### Pasos:

1. **Crear Solicitud**
   - [ ] Login como Usuario A
   - [ ] Ir a Payments
   - [ ] Seleccionar "Request Payment"
   - [ ] Seleccionar destinatario: Usuario B
   - [ ] Seleccionar token: USDC
   - [ ] Ingresar cantidad: 20 USDC
   - [ ] Crear solicitud

2. **Verificar Solicitud**
   - [ ] Verificar que la solicitud se crea
   - [ ] Verificar que aparece en lista de solicitudes

3. **Pagar Solicitud (Usuario B)**
   - [ ] Login como Usuario B
   - [ ] Verificar que ve la solicitud
   - [ ] Aceptar solicitud
   - [ ] Configurar pago
   - [ ] Enviar pago

4. **Verificar Resultado**
   - [ ] Verificar que el pago se completa
   - [ ] Verificar que ambos usuarios ven la transacción

### ✅ Criterios de Éxito:
- [ ] Solicitud se crea correctamente
- [ ] Usuario B ve la solicitud
- [ ] Pago se completa correctamente
- [ ] Ambos usuarios ven la transacción

---

## ⚠️ Test 6: Validaciones y Errores

### Test 6.1: Balance Insuficiente

1. **Preparación**
   - [ ] Usuario tiene 10 USDC
   - [ ] Intentar enviar 20 USDC

2. **Verificar Validación**
   - [ ] Verificar que se muestra mensaje de error
   - [ ] Verificar que el botón Send está deshabilitado
   - [ ] Verificar que no se envía el pago

### Test 6.2: Cantidad Inválida

1. **Test con 0**
   - [ ] Intentar enviar 0 USDC
   - [ ] Verificar validación

2. **Test con cantidad negativa**
   - [ ] Intentar ingresar cantidad negativa
   - [ ] Verificar validación

### Test 6.3: Dirección Inválida

1. **Test con dirección mal formateada**
   - [ ] Intentar enviar a `0xinvalid`
   - [ ] Verificar mensaje de error

### Test 6.4: Alias Inexistente

1. **Test con alias que no existe**
   - [ ] Intentar enviar a `@usuario_inexistente`
   - [ ] Verificar mensaje de error

---

## 🔄 Test 7: Auto-Bridge

### Pasos:

1. **Preparación**
   - [ ] Usuario tiene USDC solo en Solana
   - [ ] Intentar enviar a dirección Ethereum

2. **Verificar Auto-Bridge**
   - [ ] Verificar que se sugiere auto-bridge
   - [ ] Aceptar auto-bridge
   - [ ] Verificar que el pago se envía
   - [ ] Verificar que funciona correctamente

### ✅ Criterios de Éxito:
- [ ] Auto-bridge se detecta correctamente
- [ ] Pago con auto-bridge funciona
- [ ] Balance se actualiza correctamente

---

## 📊 Resumen de Tests

Completar todos los tests y marcar:

- [ ] Test 1: Pago Crypto a Usuario HiHODL ✅
- [ ] Test 2: Pago Crypto a Wallet Externa ✅
- [ ] Test 3: Pago PIX ✅
- [ ] Test 4: Pago Mercado Pago ✅
- [ ] Test 5: Solicitar Pago ✅
- [ ] Test 6: Validaciones y Errores ✅
- [ ] Test 7: Auto-Bridge ✅

---

## 🐛 Reportar Issues

Si encuentras algún problema:

1. **Capturar logs:**
   - Screenshots del error
   - Logs de la consola
   - Network requests (si es posible)

2. **Documentar:**
   - Qué test falló
   - Pasos para reproducir
   - Comportamiento esperado vs actual

3. **Reportar:**
   - Crear issue en el repositorio
   - O documentar en el equipo

---

**Última actualización:** 2024-11-02



