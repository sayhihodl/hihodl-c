#!/bin/bash
# Script para hacer build de producción
# Uso: ./scripts/build-production.sh [android|ios|both]

PLATFORM=${1:-both}

echo "🚀 Iniciando build de producción..."
echo ""

# Verificar que EAS CLI está instalado
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI no está instalado. Instalando..."
    npm install -g eas-cli
fi

# Verificar que estás logueado
echo "Verificando login en EAS..."
eas whoami || {
    echo "❌ No estás logueado. Ejecuta: eas login"
    exit 1
}

echo ""
echo "📦 Verificando configuración..."
echo ""

# Verificar que las variables están en EAS Secrets
echo "Verificando EAS Secrets..."
secrets=$(eas secret:list 2>/dev/null)
if [ $? -ne 0 ] || [ -z "$secrets" ]; then
    echo "⚠️  No se encontraron secrets. Ejecuta primero: ./scripts/setup-eas-secrets.sh"
    read -p "¿Continuar de todas formas? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🔨 Iniciando build(s)..."
echo ""

if [ "$PLATFORM" = "android" ] || [ "$PLATFORM" = "both" ]; then
    echo "📱 Building Android..."
    eas build --platform android --profile production
    if [ $? -ne 0 ]; then
        echo "❌ Error en build de Android"
        exit 1
    fi
fi

if [ "$PLATFORM" = "ios" ] || [ "$PLATFORM" = "both" ]; then
    echo "🍎 Building iOS..."
    eas build --platform ios --profile production
    if [ $? -ne 0 ]; then
        echo "❌ Error en build de iOS"
        exit 1
    fi
fi

echo ""
echo "✅ Build(s) completado(s)"
echo ""
echo "📋 Próximos pasos:"
echo "1. Descargar el build desde: https://expo.dev/accounts/[tu-account]/projects/hihodl-yes/builds"
echo "2. Probar en dispositivo físico"
echo "3. Si todo funciona, submitir a stores:"
echo "   eas submit --platform android --profile production"
echo "   eas submit --platform ios --profile production"

