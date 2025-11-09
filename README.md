# HIHODL Wallet

🚀 **HiHODL Wallet** is a next-generation, self-custody, multi-chain crypto wallet designed to make blockchain simple, transparent, and accessible for everyone.  
Think of it as the **Revolut of crypto**, built natively for Web3.

## 📋 Estado del Proyecto

**Versión**: 1.0.0  
**Estado**: Preparándose para producción  
**Plataformas**: iOS & Android (React Native + Expo)

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+
- npm o yarn
- Expo CLI
- EAS CLI (para builds)

### Instalación

```bash
# Instalar dependencias
npm install

# Iniciar desarrollo
npm start

# Build para iOS
npm run ios

# Build para Android
npm run android
```

## 📚 Documentación Importante

- **[PRODUCCION_CHECKLIST.md](./PRODUCCION_CHECKLIST.md)** - Checklist completo para producción
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Guía de deployment paso a paso
- **[RESUMEN_EJECUTIVO.md](./RESUMEN_EJECUTIVO.md)** - Resumen ejecutivo del estado actual

## 🔐 Configuración de Variables de Entorno

**IMPORTANTE**: Antes de construir para producción, configurar todas las variables de entorno.

Ver lista completa en `PRODUCCION_CHECKLIST.md` o usar EAS Secrets:

```bash
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "tu-valor"
```

## 🏗️ Building para Producción

```bash
# Build de producción (Android)
eas build --platform android --profile production

# Build de producción (iOS)
eas build --platform ios --profile production
```

Ver `DEPLOYMENT_GUIDE.md` para instrucciones detalladas.

## 📦 Tech Stack

- **Framework**: React Native (Expo SDK 54)
- **Routing**: Expo Router
- **State Management**: Zustand
- **Blockchain**: Ethers.js, Solana Web3.js
- **Firebase**: Authentication, Analytics
- **i18n**: i18next

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

[Especificar licencia aquí]

## 🆘 Soporte

Para problemas o preguntas, abrir un issue en el repositorio.
