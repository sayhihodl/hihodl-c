# ✅ Action Items - CTO Review

## 🔴 CRÍTICO - Antes de Producción

### 1. Testing Framework ⚠️ BLOQUEANTE
- [ ] Instalar Jest + Testing Library
- [ ] Configurar `jest.config.js`
- [ ] Crear tests para vault/crypto (crítico)
- [ ] Crear tests para stores
- [ ] Crear tests para hooks críticos
- [ ] Coverage mínimo: 60%

**Estimación:** 3-5 días  
**Ver:** `TESTING_SETUP_GUIDE.md`

---

### 2. Seguridad - Pepper ⚠️ BLOQUEANTE
- [ ] Implementar endpoint `/api/security/pepper` en backend
- [ ] Eliminar mock pepper del código
- [ ] Probar integración completa
- [ ] Documentar en backend

**Estimación:** 2-3 días (backend)  
**Ver:** `BACKEND_PASSKEYS_IMPLEMENTATION.md`

---

### 3. Seguridad - PIN ⚠️ BLOQUEANTE
- [ ] Implementar hashing de PIN con scrypt
- [ ] Actualizar `src/lib/lock.ts`
- [ ] Migrar PINs existentes (si hay)
- [ ] Testing de seguridad

**Estimación:** 1 día  
**Archivo:** `src/lib/lock.ts`

---

### 4. Refactorizar Componentes Grandes ⚠️ BLOQUEANTE
- [ ] `PaymentsThread.tsx` (1,445 líneas → <500)
- [ ] `QuickSendScreen.tsx` (1,247 líneas → <500)
- [ ] `index.tsx` dashboard (1,087 líneas → <600)

**Estrategia:**
1. Crear tests antes de refactorizar
2. Extraer lógica a hooks
3. Dividir en componentes más pequeños
4. Verificar que todo funciona

**Estimación:** 5-7 días  
**Prioridad:** Alta

---

## 🟡 IMPORTANTE - Mejoras Necesarias

### 5. Limpieza Firebase
- [ ] Evaluar si Firebase Analytics es necesario
- [ ] Si no, eliminar dependencia `firebase`
- [ ] Eliminar `src/lib/firebase.ts` (si no se usa)
- [ ] Limpiar referencias en docs

**Estimación:** 1 día  
**Ver:** `DEPRECATED_FILES.md`

---

### 6. Type Safety
- [ ] Reducir `any` de 429 → <200
- [ ] Crear tipos faltantes
- [ ] Eliminar `@ts-ignore` no justificados
- [ ] Configurar ESLint más estricto

**Estimación:** 2-3 semanas (paralelo)  
**Archivos prioritarios:**
- `src/payments/PaymentsThread.tsx` (51 any)
- `src/services/multichainSearch.ts` (17 any)

---

### 7. CI/CD Pipeline
- [ ] Configurar GitHub Actions
- [ ] Tests automáticos en PR
- [ ] Linting automático
- [ ] Build checks

**Estimación:** 1-2 días  
**Template:** `.github/workflows/ci.yml`

---

### 8. Rate Limiting
- [ ] Implementar en login
- [ ] Implementar en PIN attempts
- [ ] Backend rate limiting
- [ ] Frontend throttling

**Estimación:** 2-3 días  
**Archivos:** `src/auth/email.ts`, `src/lib/lock.ts`

---

### 9. Performance Audit
- [ ] React DevTools Profiler
- [ ] Bundle size analysis
- [ ] Memory leak detection
- [ ] Optimizar componentes críticos

**Estimación:** 1 semana  
**Herramientas:** React DevTools, Bundle Analyzer

---

### 10. Monitoring Setup
- [ ] Integrar Sentry (o similar)
- [ ] Activar crash reporting
- [ ] Configurar dashboards
- [ ] Alertas críticas

**Estimación:** 3-5 días  
**Archivo:** `src/utils/crash-reporting.ts` (ya preparado)

---

## 🟢 MEJORAS - Nice to Have

### 11. Documentación JSDoc
- [ ] Agregar JSDoc a funciones públicas
- [ ] Documentar APIs críticas
- [ ] Ejemplos de uso

**Estimación:** 1 semana (paralelo)

---

### 12. Dependencies Audit
- [ ] `npm audit` completo
- [ ] `npm outdated` review
- [ ] Actualizar dependencias críticas
- [ ] Evaluar eliminar Firebase

**Estimación:** 1 día

---

### 13. Accessibility
- [ ] Audit de accesibilidad
- [ ] Agregar labels ARIA
- [ ] Mejorar contraste
- [ ] Testing con screen readers

**Estimación:** 1 semana

---

## 📊 Priorización

### Semana 1 (Crítico):
1. ✅ Testing framework setup
2. ✅ Tests críticos (vault, crypto, stores)
3. ✅ Endpoint pepper (backend)
4. ✅ PIN hashing

### Semana 2 (Crítico):
5. ✅ Refactor PaymentsThread
6. ✅ Refactor QuickSendScreen
7. ✅ Refactor dashboard index

### Semana 3 (Importante):
8. ✅ Type safety improvements
9. ✅ CI/CD setup
10. ✅ Performance audit
11. ✅ Limpieza Firebase

### Semana 4+ (Mejoras):
12. ✅ Monitoring completo
13. ✅ Documentación JSDoc
14. ✅ Dependencies audit
15. ✅ Accessibility

---

## 📈 Métricas de Éxito

### Para Producción:
- ✅ Coverage: 60%+
- ✅ Componentes: Ninguno >1000 líneas
- ✅ Type safety: <200 `any`
- ✅ Security: Pepper real, PIN hasheado
- ✅ Tests: Todos los críticos pasando

### Para Excelencia:
- ✅ Coverage: 80%+
- ✅ Componentes: Ninguno >500 líneas
- ✅ Type safety: <50 `any`
- ✅ CI/CD: Automatizado
- ✅ Monitoring: Completo

---

**Total Estimado:** 2-3 semanas para producción, 1-2 meses para excelencia

