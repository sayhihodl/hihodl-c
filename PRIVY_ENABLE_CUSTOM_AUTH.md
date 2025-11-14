# 🔧 Habilitar External Auth Providers en Privy

## ❌ Error Actual

```
Error: External auth providers are not enabled for your account.
```

## ✅ Solución

Necesitas habilitar **"External auth providers"** o **"Custom Auth"** en el Privy Dashboard.

### Pasos para Habilitar

1. **Ir al Privy Dashboard**
   - URL: https://dashboard.privy.io/
   - Selecciona tu app: `cmhqg199a000tl70ca9h3i1pu`

2. **Navegar a Settings → Authentication**
   - O busca en: **Configuration** → **Authentication**
   - O en: **Settings** → **Advanced** → **Authentication**

3. **Buscar "External auth providers" o "Custom Auth"**
   - Puede estar en una sección llamada:
     - "Using your own authentication"
     - "External auth providers"
     - "Custom authentication"
     - "JWT-based authentication"

4. **Habilitar la opción**
   - Debe haber un toggle o checkbox para habilitar
   - Actívalo y guarda los cambios

### Ubicaciones Alternativas

Si no encuentras la opción, busca en:
- **Settings** → **Authentication** → **External providers**
- **Configuration** → **Login methods** → **Custom Auth**
- **Settings** → **Advanced** → **External auth**
- **Security** → **Authentication methods**

### Nota Importante

- Esta funcionalidad puede requerir un plan específico de Privy
- Si estás en el plan gratuito, verifica si Custom Auth está disponible
- Puede que necesites contactar al soporte de Privy para habilitarlo

---

## Verificación

Después de habilitar, reinicia la app:

```bash
npx expo start -c
```

El error debería desaparecer y verás:
- ✅ Privy App ID loaded
- ✅ Privy Client ID loaded
- ✅ Sin errores de "External auth providers"

---

## Referencias

- [Privy Docs - Using Your Own Authentication](https://docs.privy.io/guides/authentication/using-your-own-authentication)
- [Privy Dashboard](https://dashboard.privy.io/)



