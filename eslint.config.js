// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'web-build/*'],
  },
  {
    rules: {
      // Prevenir uso de any sin razón
      '@typescript-eslint/no-explicit-any': ['warn', { 
        ignoreRestArgs: false,
        fixToUnknown: true 
      }],
      // Prevenir console.log en producción (usar logger)
      'no-console': ['warn', { 
        allow: ['warn', 'error'] 
      }],
      // React hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Prevenir variables no usadas
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
      // Prevenir var
      'no-var': 'error',
      // Prefer const/let
      'prefer-const': 'warn',
      // Prevenir funciones sin retorno (opcional, puede ser molesto)
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
]);
