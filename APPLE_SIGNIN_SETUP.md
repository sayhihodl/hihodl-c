# Configuración de Apple Sign-In con Supabase

## Paso 1: Obtener el Client ID (Service ID)

1. Ve a [Apple Developer Center](https://developer.apple.com/account/resources/identifiers/list/serviceId)
2. Haz clic en el botón **"+"** para crear un nuevo Service ID
3. Completa:
   - **Description**: "HIHODL Sign In" (o el nombre que prefieras)
   - **Identifier**: `com.sayhihodl.hihodlyes.signin` (o similar)
4. Guarda y haz clic en **"Continue"** y luego **"Register"**
5. Selecciona el Service ID recién creado
6. Marca la casilla **"Sign in with Apple"**
7. Haz clic en **"Configure"**
8. En la configuración:
   - **Primary App ID**: Selecciona tu App ID (`com.sayhihodl.hihodlyes`)
   - **Domains and Subdomains**: 
     - Agrega: `gctwjvfpwkirtybzbnmu.supabase.co` (tu dominio de Supabase)
   - **Return URLs**: 
     - Agrega: `https://gctwjvfpwkirtybzbnmu.supabase.co/auth/v1/callback`
9. Guarda los cambios
10. **Copia el Service ID** (ejemplo: `com.sayhihodl.hihodlyes.signin`) - Este es tu **Client ID**

## Paso 2: Obtener el Secret Key

### Opción A: Generar desde Supabase (Recomendado)
1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Authentication** → **Providers** → **Apple**
3. Haz clic en **"Generate Secret Key"** o el botón similar
4. Se abrirá un formulario donde necesitas:
   - **Key ID**: Lo obtienes del paso siguiente
   - **Team ID**: Lo encuentras en [Apple Developer Account](https://developer.apple.com/account) en la esquina superior derecha
   - **Private Key**: El archivo .p8 del paso siguiente

### Opción B: Generar manualmente
1. Ve a [Apple Developer Center - Keys](https://developer.apple.com/account/resources/authkeys/list)
2. Haz clic en **"+"** para crear una nueva Key
3. Completa:
   - **Key Name**: "HIHODL Sign In Key"
   - Marca la casilla **"Sign in with Apple"**
4. Haz clic en **"Continue"** y luego **"Register"**
5. **IMPORTANTE**: Descarga el archivo `.p8` (solo puedes descargarlo una vez)
6. **Copia el Key ID** que aparece (formato: `ABC123DEF4`)
7. **Copia tu Team ID** desde [Apple Developer Account](https://developer.apple.com/account) (esquina superior derecha)
8. Abre el archivo `.p8` en un editor de texto y copia todo su contenido

## Paso 3: Configurar en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Authentication** → **Providers** → **Apple**
3. Activa el toggle **"Enable Sign in with Apple"**
4. Completa los campos:
   - **Client IDs**: Pega el Service ID del Paso 1 (ejemplo: `com.sayhihodl.hihodlyes.signin`)
   - **Secret Key**: 
     - Si usaste la Opción A: Pega el secret key generado
     - Si usaste la Opción B: Genera el secret key usando:
       ```bash
       # Usa esta herramienta online o local:
       # https://github.com/auth0/node-jsonwebtoken
       # O usa el generador de Supabase con:
       # - Key ID
       # - Team ID  
       # - Contenido del archivo .p8
       ```
5. **Callback URL**: Ya está prellenado, cópialo y úsalo en el Paso 1
6. Guarda los cambios

## Paso 4: Verificar en la App

1. Asegúrate de que tu Bundle ID en `app.json` coincida con el Primary App ID configurado
2. En iOS, el Bundle ID debe ser: `com.sayhihodl.hihodlyes`
3. Prueba iniciar sesión con Apple en la app

## Notas Importantes

- ⚠️ El Secret Key expira cada 6 meses - necesitarás regenerarlo
- ✅ El Service ID puede tener múltiples Return URLs
- ✅ Puedes usar el mismo Service ID para web y mobile
- ✅ El Bundle ID debe coincidir exactamente con el configurado en Apple Developer

## Troubleshooting

**Error: "Invalid client"**
- Verifica que el Service ID esté correctamente configurado
- Asegúrate de que el Return URL esté agregado en Apple Developer Center

**Error: "Invalid secret key"**
- Verifica que el Secret Key no haya expirado
- Regenera el Secret Key si es necesario

**Error: "Bundle ID mismatch"**
- Verifica que el Bundle ID en `app.json` coincida con el Primary App ID configurado




