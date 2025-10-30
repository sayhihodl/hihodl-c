// src/shims/node.ts
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Asegura Buffer global (algunos libs asumen global.Buffer)
if (typeof global.Buffer === 'undefined') {
  (global as any).Buffer = Buffer;
}