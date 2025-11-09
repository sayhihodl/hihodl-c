// entrypoint.js
// Import required polyfills first
import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';

// Polyfills de Node existentes
import './src/shims/node';

// Then import the expo router
import 'expo-router/entry';
