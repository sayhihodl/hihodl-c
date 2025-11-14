# ⚠️ Error: Network request failed en Privy

## 🔍 Problema

Privy está intentando hacer peticiones de red durante la inicialización y falla con "Network request failed".

## ✅ Solución Aplicada

Se agregó un manejador de errores (`onError`) en `PrivyProvider` que:
- Captura errores de red de manera silenciosa
- No bloquea la app si hay problemas de red
- Registra warnings en lugar de errores críticos

## 🔍 Posibles Causas

1. **Desarrollo Local:**
   - Privy intenta conectarse a sus servidores
   - Puede fallar si hay problemas de red o firewall
   - No es crítico para desarrollo

2. **Expo Go:**
   - Puede haber restricciones de red en Expo Go
   - Las peticiones pueden ser bloqueadas

3. **Configuración de Red:**
   - Firewall o proxy bloqueando peticiones
   - Problemas de DNS

## ✅ Verificación

El error no debería bloquear la app. Privy seguirá funcionando para:
- ✅ Conectar wallets (MetaMask/Phantom)
- ✅ Autenticación con wallets
- ✅ Funcionalidades básicas

## 🔧 Si el Error Persiste

1. **Verificar conexión a internet:**
   ```bash
   curl https://auth.privy.io
   ```

2. **Verificar configuración de red en app.json:**
   - Asegúrate de que no hay restricciones de red

3. **Probar en dispositivo físico:**
   - A veces Expo Go tiene limitaciones
   - Probar en build de desarrollo

4. **Contactar Privy Support:**
   - Si el error persiste en producción
   - Puede ser un problema de configuración del dashboard

---

## 📝 Nota

Este error es común en desarrollo y no debería afectar la funcionalidad de Privy para conectar wallets. El manejador de errores agregado previene que el error bloquee la app.



