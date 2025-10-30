import { Buffer } from 'buffer';

export function encryptSeed(seed: string, pass: string): string {
  const data = `${pass}::${seed}`;
  return Buffer.from(data, 'utf8').toString('base64');
}

export function decryptSeed(b64: string, pass: string): string {
  const raw = Buffer.from(b64, 'base64').toString('utf8');
  const [p, seed] = raw.split('::');
  if (p !== pass) throw new Error('Invalid password');
  return seed ?? '';
}