# Guía de Certificados iOS - Code Signing

## 🎯 ¿Qué Certificado Necesitas?

### Para SIMULADOR: ❌ NO necesitas certificados
El simulador iOS **NO requiere certificados**. Puedes probar tu app gratis.

### Para DISPOSITIVO FÍSICO: ✅ Necesitas certificado de desarrollo

Hay dos opciones:

---

## 📱 Opción 1: Apple Developer Account (Recomendado)

**Costo:** $99 USD/año

**Qué te permite:**
- ✅ Probar en dispositivos físicos sin límite
- ✅ Subir a App Store
- ✅ TestFlight
- ✅ Certificados válidos por 1 año

**Cómo obtenerlo:**
1. Ve a: https://developer.apple.com/programs/
2. Haz clic en "Enroll"
3. Paga $99 USD
4. Espera aprobación (1-2 días normalmente)

**Una vez tengas la cuenta:**
```bash
# Xcode configurará automáticamente:
# 1. Abre Xcode
# 2. Xcode > Settings > Accounts
# 3. Agrega tu Apple ID
# 4. Xcode descargará los certificados automáticamente
```

---

## 💰 Opción 2: Desarrollo Gratis (Limitado)

**Costo:** Gratis

**Qué te permite:**
- ✅ Probar en tu propio iPhone (máximo 3 dispositivos)
- ✅ Aplicaciones expiran en 7 días
- ❌ NO puedes subir a App Store
- ❌ NO puedes usar TestFlight

**Cómo configurarlo:**

### Paso 1: Iniciar sesión en Xcode

```bash
# 1. Abre Xcode
open ios/HIHODL.xcworkspace

# 2. Ve a: Xcode > Settings (o Preferences)
# 3. Pestaña "Accounts"
# 4. Haz clic en "+" y agrega tu Apple ID personal (el que usas para iCloud)
```

### Paso 2: Configurar Team en el Proyecto

1. En Xcode, selecciona el proyecto `HIHODL` en el navegador izquierdo
2. Ve a la pestaña "Signing & Capabilities"
3. En "Team", selecciona tu Apple ID (aparecerá como "Personal Team")
4. Xcode generará automáticamente un "Provisioning Profile"

### Paso 3: Conectar tu iPhone

```bash
# 1. Conecta tu iPhone por USB
# 2. Desbloquea tu iPhone
# 3. Confía en la computadora cuando pregunte
# 4. En Xcode, selecciona tu iPhone en la lista de dispositivos (arriba)
# 5. Presiona Cmd+R para ejecutar
```

**Primera vez:**
- Tu iPhone pedirá confiar en el desarrollador
- Ve a: Settings > General > VPN & Device Management
- Confía en tu certificado

---

## 🔍 Verificar tu Configuración Actual

### Ver qué certificados tienes:

```bash
# Ver perfiles de provisioning instalados
ls ~/Library/MobileDevice/Provisioning\ Profiles/

# Ver certificados en Keychain
security find-identity -v -p codesigning
```

### En Xcode:

1. Xcode > Settings > Accounts
2. Selecciona tu cuenta
3. Haz clic en "Manage Certificates..."
4. Verás tus certificados instalados

---

## 🚀 Recomendación para Tu Caso

**Para desarrollar y probar AHORA:**

1. **Usa el simulador** - No necesitas nada más ✅
   ```bash
   open ios/HIHODL.xcworkspace
   # Presiona Cmd+R en Xcode
   ```

2. **Si quieres probar en tu iPhone:**
   - Opción gratis: Agrega tu Apple ID en Xcode (7 días válido)
   - Opción completa: Consigue Apple Developer ($99/año)

---

## ⚙️ Configuración Automática de Certificados

Xcode puede crear certificados automáticamente si:

1. Tienes una cuenta Apple ID agregada
2. El proyecto está configurado con "Automatically manage signing"
3. Seleccionaste tu Team

**Para activarlo:**

1. Abre `ios/HIHODL.xcworkspace` en Xcode
2. Selecciona el proyecto `HIHODL` (icono azul arriba a la izquierda)
3. Selecciona el target `HIHODL`
4. Ve a "Signing & Capabilities"
5. ✅ Marca "Automatically manage signing"
6. Selecciona tu Team

Xcode hará todo automáticamente.

---

## 🔧 Troubleshooting

### Error: "No signing certificate found"

**Solución:**
1. Agrega tu Apple ID en Xcode > Settings > Accounts
2. En Signing & Capabilities, selecciona tu Team
3. Xcode generará el certificado automáticamente

### Error: "Provisioning profile not found"

**Solución:**
1. En Xcode, ve a Signing & Capabilities
2. Cambia el Bundle Identifier (puede estar en conflicto)
   - Ejemplo: `com.sayhihodl.hihodlyes` → `com.tunombre.hihodlyes`
3. Xcode generará un nuevo perfil

### Error: "Device not registered"

**Solución:**
1. Conecta tu iPhone
2. Ve a Window > Devices and Simulators
3. Tu iPhone aparecerá y se registrará automáticamente

---

## 📚 Recursos

- [Apple Developer Program](https://developer.apple.com/programs/)
- [Code Signing Guide](https://developer.apple.com/library/archive/documentation/Security/Conceptual/CodeSigningGuide/)
- [Free Development Account](https://developer.apple.com/support/compare-memberships/)

---

## 💡 Resumen

| Escenario | Certificado Necesario | Costo |
|-----------|----------------------|-------|
| Simulador iOS | ❌ No | Gratis |
| iPhone físico (desarrollo) | ✅ Apple ID personal | Gratis (7 días) |
| iPhone físico (producción) | ✅ Apple Developer | $99/año |
| App Store | ✅ Apple Developer | $99/año |

**Para tu caso ahora:** Usa el simulador - no necesitas certificados.






