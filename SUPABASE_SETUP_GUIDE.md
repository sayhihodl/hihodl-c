# 🔧 Guía Detallada: Configurar Supabase en HIHODL

## 📋 Tabla de Contenidos

1. [Crear Proyecto en Supabase](#1-crear-proyecto-en-supabase)
2. [Obtener Credenciales](#2-obtener-credenciales)
3. [Configurar Variables de Entorno (Desarrollo Local)](#3-configurar-variables-de-entorno-desarrollo-local)
4. [Configurar Variables de Entorno (Producción con EAS)](#4-configurar-variables-de-entorno-producción-con-eas)
5. [Verificar Configuración](#5-verificar-configuración)
6. [Reiniciar la Aplicación](#6-reiniciar-la-aplicación)

---

## 1. Crear Proyecto en Supabase

### Paso 1: Registrarse/Crear Cuenta

1. Ve a **https://supabase.com**
2. Haz clic en **"Start your project"** o **"Sign in"**
3. Si no tienes cuenta, regístrate con GitHub, Google, o email

### Paso 2: Crear Nuevo Proyecto

1. Una vez dentro del dashboard, haz clic en **"New Project"**
2. Completa el formulario:
   - **Organization:** Selecciona o crea una organización
   - **Name:** `hihodl-app` (o el nombre que prefieras)
   - **Database Password:** Crea una contraseña segura (⚠️ **GUÁRDALA**, la necesitarás después)
   - **Region:** Elige la más cercana (ej: `us-east-1`, `eu-west-1`)
3. Haz clic en **"Create new project"**
4. Espera 2-3 minutos mientras Supabase configura tu proyecto

---

## 2. Obtener Credenciales

Una vez que tu proyecto esté listo:

### Paso 1: Ir a Settings

1. En el dashboard de Supabase, haz clic en el icono de **⚙️ Settings** (esquina inferior izquierda)
2. Selecciona **"API"** del menú lateral

### Paso 2: Copiar Credenciales

Encontrarás dos valores importantes:

#### **Project URL:**
```
https://xxxxxxxxxxxxx.supabase.co
```
- Haz clic en el ícono de copiar 📋 al lado de "Project URL"
- Este es tu `EXPO_PUBLIC_SUPABASE_URL`

#### **anon/public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NjEwNjEwMCwiZXhwIjoxOTYxNjgyMTAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
- Haz clic en el ícono de copiar 📋 al lado de "anon public" key
- Este es tu `EXPO_PUBLIC_SUPABASE_ANON_KEY`

⚠️ **IMPORTANTE:** 
- La clave `anon` es pública y segura para usar en el frontend
- **NO** uses la clave `service_role` (es privada y solo para backend)

---

## 3. Configurar Variables de Entorno (Desarrollo Local)

### Opción A: Archivo `.env` (Recomendado para desarrollo)

#### Paso 1: Crear archivo `.env` en la raíz del proyecto

```bash
# Desde la terminal, en la raíz del proyecto:
touch .env
```

O manualmente:
- Crea un nuevo archivo llamado `.env` (sin extensión)
- Debe estar en la misma carpeta que `package.json` y `app.json`

#### Paso 2: Agregar las variables

Abre el archivo `.env` y agrega:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxx
```

**Ejemplo real:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYxMDYxMDAsImV4cCI6MTk2MTY4MjEwMH0.xxxxxxxxxxxxx
```

#### Paso 3: Verificar que `.env` está en `.gitignore`

⚠️ **CRÍTICO:** Asegúrate de que `.env` esté en tu `.gitignore` para no subir tus credenciales a Git.

Verifica tu `.gitignore`:
```bash
cat .gitignore | grep .env
```

Si no aparece, agrégalo:
```bash
echo ".env" >> .gitignore
```

#### Paso 4: Instalar dotenv (si es necesario)

Expo maneja automáticamente las variables `EXPO_PUBLIC_*`, así que normalmente no necesitas `dotenv`. Si tienes problemas, puedes usar:

```bash
npm install --save-dev @expo/config-plugins
```

---

### Opción B: Variables de Entorno del Sistema

Si prefieres usar variables del sistema operativo:

#### En macOS/Linux:

```bash
# Agregar al archivo ~/.zshrc o ~/.bash_profile
export EXPO_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxx"

# Luego recargar:
source ~/.zshrc
```

#### En Windows (PowerShell):

```powershell
$env:EXPO_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
$env:EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxx"
```

#### En Windows (CMD):

```cmd
set EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
set EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxx
```

---

## 4. Configurar Variables de Entorno (Producción con EAS)

Para builds de producción usando EAS Build, usa **EAS Secrets**.

### Paso 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Paso 2: Login a EAS

```bash
eas login
```

Te pedirá autenticarte con tu cuenta de Expo.

### Paso 3: Configurar Secrets

```bash
# Configurar Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxxxxxxxxxxx.supabase.co"

# Configurar Supabase Anon Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxx"
```

**Ejemplo completo:**
```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://abcdefghijk.supabase.co"

eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDYxMDYxMDAsImV4cCI6MTk2MTY4MjEwMH0.xxxxxxxxxxxxx"
```

### Paso 4: Verificar Secrets

```bash
eas secret:list
```

Deberías ver tus secrets listados.

### Paso 5: Configurar eas.json (si no existe)

Si tu proyecto usa EAS Build, asegúrate de que `eas.json` tenga referencias a estas variables o que estén configuradas para el build.

---

## 5. Verificar Configuración

### Método 1: Verificar en código

Crea un archivo temporal `test-env.js` en la raíz:

```javascript
console.log('SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurado' : '❌ Faltante');
```

Ejecuta:
```bash
node test-env.js
```

Luego elimínalo:
```bash
rm test-env.js
```

### Método 2: Verificar en la app

Cuando ejecutes la app, deberías ver en los logs:

**✅ Si está configurado correctamente:**
- No verás el warning `⚠️ Supabase URL or Anon Key missing`
- La autenticación funcionará

**❌ Si NO está configurado:**
- Verás warnings en consola
- La autenticación mostrará errores claros

---

## 6. Reiniciar la Aplicación

⚠️ **IMPORTANTE:** Las variables de entorno solo se cargan al iniciar la app.

### Paso 1: Detener la app actual

Si tienes la app corriendo:
- Presiona `Ctrl + C` en la terminal donde corre Expo
- O detén el proceso en tu IDE

### Paso 2: Limpiar caché (Recomendado)

```bash
# Limpiar caché de Expo
expo start -c

# O si usas npm/yarn:
npm start -- --clear
```

### Paso 3: Reiniciar

```bash
# Iniciar de nuevo
expo start

# O con limpieza de caché
expo start -c
```

### Paso 4: Verificar en los logs

Al iniciar, deberías ver:
- ✅ Sin warnings sobre Supabase
- ✅ O warnings informativos (si no está configurado, pero no crashea)

---

## 🎯 Checklist de Configuración

Marca cada paso cuando lo completes:

- [ ] Cuenta de Supabase creada
- [ ] Proyecto creado en Supabase
- [ ] Project URL copiado
- [ ] Anon Key copiada
- [ ] Archivo `.env` creado (o variables del sistema)
- [ ] Variables agregadas al `.env`
- [ ] `.env` agregado a `.gitignore`
- [ ] App reiniciada con caché limpia
- [ ] Verificado que no hay warnings de Supabase
- [ ] Probado login/signup (debería funcionar ahora)

---

## 🐛 Troubleshooting

### Problema: "Supabase URL or Anon Key missing"

**Solución:**
1. Verifica que las variables tengan el prefijo `EXPO_PUBLIC_`
2. Reinicia la app con `expo start -c`
3. Verifica que el archivo `.env` esté en la raíz del proyecto
4. En desarrollo, usa `expo start` (no `npm start` directamente)

### Problema: Variables no se cargan

**Solución:**
1. Limpia caché: `expo start -c`
2. Verifica que no haya espacios extra en `.env`
3. No uses comillas en `.env` (a menos que sean parte del valor)
4. En macOS/Linux, usa comillas dobles en terminal: `export VAR="value"`

### Problema: "Invalid API key" en autenticación

**Solución:**
1. Verifica que copiaste la clave `anon` (no `service_role`)
2. Asegúrate de que no hay espacios extra al copiar
3. Verifica que la URL termina con `.supabase.co`

---

## 📚 Recursos Adicionales

- **Documentación Supabase:** https://supabase.com/docs
- **EAS Secrets:** https://docs.expo.dev/build-reference/variables/
- **Expo Environment Variables:** https://docs.expo.dev/guides/environment-variables/

---

## ✅ Siguiente Paso

Una vez configurado, continúa con:
- **`BACKEND_PASSKEYS_IMPLEMENTATION.md`** - Para configurar las tablas y endpoints de passkeys
- Probar autenticación con email/password
- Configurar OAuth providers en Supabase dashboard

---

**¿Necesitas ayuda?** Revisa los logs de la app o la documentación de Supabase.
