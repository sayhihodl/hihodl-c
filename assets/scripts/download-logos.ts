// scripts/download-logos.ts
import { promises as fs } from 'fs';
import path from 'path';

type Chain =
  | 'solana'
  | 'eip155:1' // Ethereum
  | 'eip155:8453' // Base
  | 'eip155:137'; // Polygon

type FeaturedToken = {
  symbol: string;           // 'BONK'
  name?: string;            // 'Bonk'
  chain: Chain;             // 'solana'
  mint?: string;            // only Solana (SPL mint)
  address?: string;         // only EVM
  coingeckoId?: string;     // 'bonk'
  logoURI?: string;         // optional direct PNG url
};

const ROOT = process.cwd();
const LIST_PATH = path.join(ROOT, '@/assets/tokens/token-list/featured.json');

const OUT_DIRS: Record<string, string> = {
  'solana': 'assets/tokens/solana',
  'eip155:1': 'assets/tokens/eip155-1',
  'eip155:8453': 'assets/tokens/eip155-8453',
  'eip155:137': 'assets/tokens/eip155-137',
};

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function httpGetBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

async function fromCoinGecko(id: string): Promise<Buffer | null> {
  // Evita rate limits: pide /coins/{id}?localization=false...
  const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(id)}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json() as any;
  const img = json?.image?.large || json?.image?.small;
  if (!img) return null;
  return await httpGetBuffer(img);
}

async function fromTrustWalletSolana(mint: string): Promise<Buffer | null> {
  const url = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/assets/${mint}/logo.png`;
  return await httpGetBuffer(url);
}

// Podrías añadir aquí más fallbacks (Raydium/Orca tokenlists) si quieres:
async function fromDirectURI(uri: string): Promise<Buffer | null> {
  return await httpGetBuffer(uri);
}

function outPathFor(t: FeaturedToken): string {
  const dir = OUT_DIRS[t.chain] || 'assets/tokens/misc';
  const file = `${t.symbol.toLowerCase()}.png`;
  return path.join(ROOT, dir, file);
}

async function main() {
  const raw = await fs.readFile(LIST_PATH, 'utf8');
  const list: FeaturedToken[] = JSON.parse(raw);

  // Asegura carpetas
  await Promise.all(Object.values(OUT_DIRS).map(ensureDir));

  let ok = 0, fail = 0;
  for (const t of list) {
    const dest = outPathFor(t);
    try {
      // Skip si ya existe
      try {
        await fs.access(dest);
        console.log(`✔︎ Skip (existe): ${t.symbol} -> ${dest}`);
        ok++;
        continue;
      } catch {}

      let buf: Buffer | null = null;

      // 1) CoinGecko si hay id
      if (!buf && t.coingeckoId) {
        buf = await fromCoinGecko(t.coingeckoId);
      }
      // 2) TrustWallet (Solana) si hay mint
      if (!buf && t.chain === 'solana' && t.mint) {
        buf = await fromTrustWalletSolana(t.mint);
      }
      // 3) Directo logoURI si lo diste
      if (!buf && t.logoURI) {
        buf = await fromDirectURI(t.logoURI);
      }

      if (!buf) {
        throw new Error('No se pudo resolver logo por CoinGecko/TrustWallet/logoURI');
      }

      await ensureDir(path.dirname(dest));
      await fs.writeFile(dest, buf);
      console.log(`✅ Guardado: ${t.symbol} -> ${dest}`);
      ok++;
    } catch (e: any) {
      console.warn(`⚠️  Fallo con ${t.symbol}: ${e?.message || e}`);
      fail++;
    }
  }

  console.log(`\nHecho. OK: ${ok}  |  Fallos: ${fail}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});