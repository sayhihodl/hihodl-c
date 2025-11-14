# ✅ Checklist Rápido de Testing

**Usa este checklist mientras haces testing. Marca cada item cuando lo completes.**

---

## 🔴 PRIORIDAD 1: PAGOS (CRÍTICO)

### 💳 Pago Crypto a Usuario HiHODL
- [ ] Login como Usuario A
- [ ] Navegar a Send
- [ ] Buscar usuario por alias `@usuario_b`
- [ ] Seleccionar token (USDC) y chain (Ethereum)
- [ ] Ingresar cantidad (10 USDC)
- [ ] Enviar pago
- [ ] ✅ Verificar confirmación
- [ ] ✅ Verificar balance actualizado
- [ ] Login como Usuario B
- [ ] ✅ Verificar que recibió el pago

### 💳 Pago Crypto a Wallet Externa
- [ ] Login como Usuario A
- [ ] Ir a Send
- [ ] Ingresar dirección externa: `0x...`
- [ ] Seleccionar token y chain
- [ ] Ingresar cantidad
- [ ] Confirmar en pantalla de confirmación
- [ ] Enviar pago
- [ ] ✅ Verificar confirmación
- [ ] ✅ Verificar en blockchain explorer
- [ ] ✅ Verificar balance actualizado

### 🇧🇷 Pago PIX
- [ ] Login como Usuario A
- [ ] Ir a Payments → PIX
- [ ] Ingresar PIX Key
- [ ] Seleccionar token (USDC)
- [ ] Ingresar cantidad
- [ ] ✅ Verificar conversión a BRL
- [ ] Enviar pago
- [ ] ✅ Verificar confirmación
- [ ] ✅ Verificar balance actualizado

### 🇦🇷 Pago Mercado Pago
- [ ] Login como Usuario A
- [ ] Ir a Payments → Mercado Pago
- [ ] Ingresar Mercado Pago ID
- [ ] Seleccionar currency (ARS)
- [ ] Seleccionar token
- [ ] Ingresar cantidad
- [ ] ✅ Verificar conversión a ARS
- [ ] Enviar pago
- [ ] ✅ Verificar confirmación
- [ ] ✅ Verificar balance actualizado

### 📝 Solicitar Pago
- [ ] Usuario A: Crear solicitud de pago
- [ ] ✅ Verificar que se crea
- [ ] Usuario B: Ver solicitud
- [ ] Usuario B: Aceptar y pagar
- [ ] ✅ Verificar que ambos ven la transacción

### ⚠️ Validaciones de Pago
- [ ] ✅ Balance insuficiente → Muestra error
- [ ] ✅ Cantidad 0 → Botón deshabilitado
- [ ] ✅ Dirección inválida → Muestra error
- [ ] ✅ Alias inexistente → Muestra error

---

## 🟠 PRIORIDAD 2: APIs CORE

### 🔐 Autenticación
- [ ] ✅ Login con email/password
- [ ] ✅ Login con Google
- [ ] ✅ Login con Apple
- [ ] ✅ Refresh token funciona
- [ ] ✅ Logout funciona

### 💼 Wallets
- [ ] ✅ Vincular wallet Ethereum
- [ ] ✅ Vincular wallet Solana
- [ ] ✅ Listar wallets
- [ ] ✅ Obtener dirección de recepción
- [ ] ✅ QR code se genera correctamente

### 💰 Balances
- [ ] ✅ Cargar balances de todas las chains
- [ ] ✅ Balance se actualiza después de transacción
- [ ] ✅ Balance por cuenta (Daily/Savings/Social)

### 📤 Transfers
- [ ] ✅ Obtener quote de transferencia
- [ ] ✅ Enviar transferencia
- [ ] ✅ Ver estado de transferencia
- [ ] ✅ Ver historial de transferencias

---

## 🟡 PRIORIDAD 3: WORKFLOWS

### 🔄 Onboarding
- [ ] ✅ Crear cuenta nueva
- [ ] ✅ Verificar email
- [ ] ✅ Configurar username
- [ ] ✅ Configurar PIN
- [ ] ✅ Configurar seguridad
- [ ] ✅ Seleccionar cuenta principal
- [ ] ✅ Completar onboarding

### 🔄 Cambio de Plan
- [ ] ✅ Ver planes disponibles
- [ ] ✅ Seleccionar nuevo plan
- [ ] ✅ Completar checkout
- [ ] ✅ Verificar que el plan se actualiza
- [ ] ✅ Verificar límites actualizados

---

## 🟢 PRIORIDAD 4: UI/UX

### 📱 Navegación
- [ ] ✅ Home → Send funciona
- [ ] ✅ Home → Receive funciona
- [ ] ✅ Home → Payments funciona
- [ ] ✅ Home → Settings funciona
- [ ] ✅ No hay crashes

### 🎨 Pantallas
- [ ] ✅ Dashboard carga correctamente
- [ ] ✅ Send screen funciona
- [ ] ✅ Receive screen funciona
- [ ] ✅ Payments screen funciona

---

## ✅ Checklist Final

Antes de considerar testing completo:

- [ ] ✅ Todos los tests de Prioridad 1 (Pagos) pasan
- [ ] ✅ Todas las APIs críticas conectadas
- [ ] ✅ No hay crashes conocidos
- [ ] ✅ Errores se manejan correctamente
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Backend funcionando

---

**Fecha de testing:** _______________  
**Tester:** _______________  
**Notas:** _______________



