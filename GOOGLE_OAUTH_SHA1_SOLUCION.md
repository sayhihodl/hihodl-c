# 🔧 Solución: Obtener SHA-1 sin Java

## ⚠️ Problema

No tienes Java instalado, pero necesitas el SHA-1 para crear el Android Client ID.

---

## ✅ Solución Rápida: Crear Android Client SIN SHA-1 Primero

**Google permite crear el Android Client ID sin SHA-1** y agregarlo después.

### Pasos:

1. **Crea el Android Client ID** con:
   - Application type: **Android**
   - Name: `hihodl-android`
   - Package name: `com.sayhihodl.hihodlyes`
   - **SHA-1**: **DÉJALO VACÍO** (puedes agregarlo después)
2. Click en **"Create"**
3. **Copia el Client ID** → `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

### Agregar SHA-1 Después:

1. Ve a la lista de Credenciales
2. Click en **"hihodl-android"** (tu Android Client ID)
3. En la sección **"SHA-1 certificate fingerprints"**, click en **"+ Add fingerprint"**
4. Pega el SHA-1 cuando lo obtengas

---

## 🔧 Opción 2: Instalar Java (Recomendado)

### Instalar Java con Homebrew:

```bash
# Instalar Homebrew si no lo tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Java
brew install openjdk@17

# Agregar al PATH (temporal)
export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"

# O agregar permanentemente a ~/.zshrc
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Luego obtener SHA-1:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

Busca la línea **"SHA1:"** y copia el valor.

---

## 🚀 Opción 3: Usar Android Studio (Si lo tienes)

Si tienes Android Studio instalado:

1. Abre Android Studio
2. Ve a: **Tools** → **SDK Manager**
3. En la pestaña **"SDK Tools"**, marca **"Android SDK Command-line Tools"**
4. Click en **"Apply"** y **"OK"**
5. Luego usa el keytool de Android Studio:

```bash
# Buscar keytool en Android Studio
find ~/Library/Android/sdk -name keytool 2>/dev/null

# Usar la ruta completa
~/Library/Android/sdk/jre/bin/keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

## 💡 Recomendación

**Para desarrollo rápido:**
- Crea el Android Client ID **sin SHA-1** primero
- Agrega el SHA-1 después cuando instales Java o uses Android Studio
- Esto te permite continuar con la configuración ahora

**Para producción:**
- Necesitarás el SHA-1 de tu keystore de producción
- Lo obtendrás cuando crees el keystore de producción con EAS

---

## ✅ Próximos Pasos

1. **Crea el Android Client ID sin SHA-1** (puedes agregarlo después)
2. **Copia los 3 Client IDs** (Web, iOS, Android)
3. **Configura en Supabase** (solo Web Client ID + Secret)
4. **Agrega variables al .env**
5. **Agrega SHA-1 después** cuando tengas Java instalado

---

## 📝 Nota Importante

El SHA-1 es necesario para que Google OAuth funcione en Android, pero **no es crítico para empezar**. Puedes:

- Crear el Client ID ahora sin SHA-1
- Probar la app en iOS/Web primero
- Agregar SHA-1 después cuando lo necesites para Android



