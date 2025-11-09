# 🔧 Habilitar JWT-based Authentication en Privy

## ❌ Error Actual

```
Error: JWT-based authentication is not enabled for your app.
```

## ✅ Solución

Aunque "Custom authentication" está habilitado, necesitas habilitar específicamente **"JWT-based authentication"**.

### Pasos en el Dashboard

1. **Ve a la sección que encontraste:**
   - **Integrations** → **Plugins** → **Custom authentication**

2. **Haz clic en "Custom authentication"** (o en el toggle si hay opciones adicionales)

3. **Busca opciones como:**
   - "JWT-based authentication"
   - "Enable JWT tokens"
   - "Token format" o "Authentication method"
   - Un sub-toggle o checkbox para JWT

4. **Habilita JWT-based authentication** y guarda

### Ubicaciones Alternativas

Si no encuentras la opción en "Custom authentication", busca en:

- **Settings** → **Advanced** → Buscar "JWT" o "Token"
- **Configuration** → **Authentication** → Buscar "JWT"
- Dentro de "Custom authentication" puede haber un menú desplegable o sección expandible

### Configuración Esperada

Deberías ver algo como:
- ✅ Custom authentication: **ON**
- ✅ JWT-based authentication: **ON** (o habilitado)
- ✅ Token format: **JWT** (o similar)

---

## 📝 Nota

Es posible que necesites:
1. Hacer clic en "Custom authentication" para ver opciones adicionales
2. Expandir una sección dentro de "Custom authentication"
3. Configurar el formato de token como "JWT"

---

## 🔄 Después de Habilitar

1. Guarda los cambios en el dashboard
2. Reinicia la app: `npx expo start -c`
3. El error debería desaparecer

---

## Referencias

- [Privy Docs - Using Your Own Authentication](https://docs.privy.io/guides/authentication/using-your-own-authentication)
- [Privy Dashboard](https://dashboard.privy.io/)

