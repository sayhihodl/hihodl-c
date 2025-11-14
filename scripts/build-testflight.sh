#!/bin/bash
# Script para hacer build de iOS para TestFlight
# Uso: ./scripts/build-testflight.sh

set -e

echo "🚀 Building iOS app for TestFlight..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "app.json" ]; then
    echo "❌ Error: No se encontró app.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Verificar que EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "❌ Error: EAS CLI no está instalado."
    echo "Instala con: npm install -g eas-cli"
    exit 1
fi

# Verificar que estás logueado en EAS
if ! eas whoami &> /dev/null; then
    echo "⚠️  No estás logueado en EAS. Iniciando login..."
    eas login
fi

echo "📋 Verificando configuración..."
echo ""

# Verificar URLs legales
echo "🔍 Verificando URLs legales..."
if [ -f "./scripts/check-legal-urls.sh" ]; then
    ./scripts/check-legal-urls.sh
    if [ $? -ne 0 ]; then
        echo ""
        echo "⚠️  Advertencia: Algunas URLs legales no están disponibles."
        echo "Continúas de todas formas? (y/n)"
        read -r response
        if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
            echo "Build cancelado."
            exit 1
        fi
    fi
else
    echo "⚠️  Script de verificación de URLs no encontrado. Continuando..."
fi

echo ""
echo "📦 Iniciando build para TestFlight..."
echo ""
echo "Este proceso puede tomar 20-40 minutos."
echo "Puedes ver el progreso en: https://expo.dev/accounts/sayhihodl/projects/hihodl-yes/builds"
echo ""

# Hacer el build
eas build --platform ios --profile testflight

echo ""
echo "✅ Build completado!"
echo ""
echo "📱 Próximos pasos:"
echo "1. Ve a App Store Connect: https://appstoreconnect.apple.com"
echo "2. Selecciona tu app"
echo "3. Ve a TestFlight"
echo "4. El build aparecerá automáticamente (puede tomar unos minutos)"
echo "5. Una vez procesado, podrás agregar testers internos/externos"
echo ""
echo "💡 Tip: Puedes usar 'eas submit --platform ios --profile testflight' para subir automáticamente a TestFlight"
echo "   (Requiere configurar appleId, ascAppId y appleTeamId en eas.json)"



