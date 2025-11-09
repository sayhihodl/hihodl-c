# 🔐 Guía Paso a Paso: Configurar Android Keystore en EAS

## Situación Actual

Estás en el menú de EAS Credentials y necesitas configurar el Keystore para Android.

---

## Opción A: Si YA tienes un keystore generado

### Paso 1: En el menú actual
1. Selecciona: **"Keystore: Manage everything needed to build your project"**
2. Presiona Enter

### Paso 2: Subir keystore existente
1. Selecciona: **"Upload a keystore"** o **"Use existing keystore"**
2. Ingresa la ruta al archivo: `./release.keystore`
3. Ingresa la contraseña del keystore
4. Ingresa la contraseña de la key (puede ser la misma)
5. Ingresa el alias: `hihodl-release`

---

## Opción B: Si NO tienes keystore (Generar uno nuevo)

### Paso 1: Salir del menú actual
1. Selecciona: **"Go back"** o **"Exit"**
2. Presiona Enter

### Paso 2: Generar keystore
Ejecuta en la terminal:
```bash
./scripts/generate-android-keystore.sh
```

O manualmente:
```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias hihodl-release \
  -keyalg RSA -keysize 2048 -validity 10000
```

**IMPORTANTE:** Guarda las contraseñas que ingreses en un lugar SEGURO.

### Paso 3: Volver a EAS Credentials
```bash
eas credentials
```

### Paso 4: Configurar keystore
1. Selecciona: **"Android"**
2. Selecciona: **"production"**
3. Selecciona: **"Keystore: Manage everything needed to build your project"**
4. Selecciona: **"Upload a keystore"**
5. Ingresa la ruta: `./release.keystore`
6. Ingresa las contraseñas que guardaste

---

## Pasos Detallados en el Menú Actual

**En el menú que ves ahora:**

1. **Selecciona:** `Keystore: Manage everything needed to build your project`
   - Usa las flechas ↑↓ para navegar
   - Presiona Enter para seleccionar

2. **EAS te preguntará:**
   - ¿Tienes un keystore? → Si NO, selecciona "Generate new keystore"
   - Si SÍ, selecciona "Upload a keystore"

3. **Si generas nuevo:**
   - EAS generará el keystore automáticamente
   - Te dará un archivo para descargar
   - **GUARDA ese archivo en lugar SEGURO**

4. **Si subes existente:**
   - Ingresa la ruta: `./release.keystore`
   - Ingresa las contraseñas
   - Ingresa el alias: `hihodl-release`

---

## Recomendación

**Si es la primera vez:**
- Deja que EAS genere el keystore automáticamente
- Es más fácil y seguro
- EAS lo guardará en sus servidores

**Pasos:**
1. Selecciona: `Keystore: Manage everything needed to build your project`
2. Selecciona: `Generate new keystore` (o similar)
3. EAS generará todo automáticamente
4. Descarga y guarda el archivo de backup que te dé EAS

---

## Después de Configurar

Verifica que se configuró correctamente:
```bash
eas credentials
# → Android → production
# Deberías ver que el keystore está configurado
```

---

## ⚠️ IMPORTANTE

- **Si EAS genera el keystore:** Descarga y guarda el archivo de backup
- **Si subes tu propio keystore:** Guarda las contraseñas en lugar SEGURO
- **Si pierdes el keystore o las contraseñas:** NO podrás actualizar tu app en Play Store

---

## Siguiente Paso

Después de configurar el keystore:
```bash
# Configurar EAS Secrets
./scripts/setup-eas-secrets.sh
```

