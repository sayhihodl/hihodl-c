#!/bin/bash
# Script para preparar y hacer push de cambios a GitHub antes de build
# Uso: ./scripts/prepare-git-push.sh

set -e

echo "🔍 Verificando estado de Git..."
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "app.json" ]; then
    echo "❌ Error: No se encontró app.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

# Verificar estado
STATUS=$(git status --porcelain)
if [ -z "$STATUS" ]; then
    echo "✅ No hay cambios pendientes"
    exit 0
fi

echo "📋 Cambios detectados:"
git status --short
echo ""

# Contar cambios
MODIFIED=$(git diff --name-only | wc -l | tr -d ' ')
UNTRACKED=$(git ls-files --others --exclude-standard | wc -l | tr -d ' ')

echo "📊 Resumen:"
echo "   - Archivos modificados: $MODIFIED"
echo "   - Archivos nuevos: $UNTRACKED"
echo ""

# Verificar commits sin push
AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "0")
if [ "$AHEAD" -gt 0 ]; then
    echo "⚠️  Tienes $AHEAD commits sin hacer push"
    echo ""
fi

echo "💡 IMPORTANTE: EAS Build usa el código de GitHub"
echo "   Si no haces push, el build usará código antiguo"
echo ""

read -p "¿Quieres hacer commit y push de los cambios? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operación cancelada"
    exit 0
fi

echo ""
echo "📦 Agregando archivos importantes..."
echo ""

# Agregar archivos de código fuente (no solo documentación)
git add -A

echo "✅ Archivos agregados"
echo ""

# Mostrar lo que se va a commitear
echo "📋 Archivos que se van a commitear:"
git status --short | head -20
if [ $(git status --short | wc -l) -gt 20 ]; then
    echo "... y más archivos"
fi
echo ""

read -p "¿Confirmar commit? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operación cancelada"
    exit 0
fi

echo ""
echo "💾 Haciendo commit..."
git commit -m "chore: sync codebase before production build

- Update app code and configurations
- Sync Android and iOS native files
- Update dependencies and build configs
- Prepare for EAS production build"

echo ""
echo "✅ Commit realizado"
echo ""

read -p "¿Hacer push a GitHub? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "⚠️  No se hizo push. Recuerda hacerlo antes del build:"
    echo "   git push origin main"
    exit 0
fi

echo ""
echo "🚀 Haciendo push a GitHub..."
git push origin main

echo ""
echo "✅ Push completado"
echo ""
echo "🎯 Próximo paso: Hacer build de producción"
echo "   eas build --platform android --profile production"
echo ""

