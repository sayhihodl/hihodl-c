import fs from "fs/promises";
import path from "path";
import fetch from "node-fetch";
import sharp from "sharp";
import { ethers } from "ethers";

// === Config ===
const CATALOG_PATH = "src/config/tokens.source.json"; // tu JSON de ~40+ tokens
const OUT_DIR = "assets/tokens-offline";
const TIMEOUT_MS = 15000;
const MAX_RETRIES = 4;

const CHAIN_FOLDER = {
  "eip155:1":       "ethereum",
  "eip155:137":     "polygon",
  "eip155:8453":    "base",
  "solana:mainnet": "solana",
};

const USER_AGENT = "Mozilla/5.0 (LogoFetcher/1.0; +https://yourapp.example)";

// === Utils ===
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function toChecksum(addr) {
  try { return ethers.utils.getAddress(addr); } catch { return addr; }
}

function trustWalletUrl(chainId, addressOrMint) {
  const folder = CHAIN_FOLDER[chainId];
  if (!folder || !addressOrMint) return null;
  const addr = chainId.startsWith("eip155:") ? toChecksum(addressOrMint) : addressOrMint;
  return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${folder}/assets/${addr}/logo.png`;
}

async function fetchWithRetry(url, { retries = MAX_RETRIES, asBuffer = true } = {}) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, signal: ctrl.signal });
      clearTimeout(id);

      if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
        // backoff
        const wait = Math.min(2000 * (attempt + 1), 8000);
        await sleep(wait);
        attempt++; 
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return asBuffer ? Buffer.from(await res.arrayBuffer()) : await res.json();
    } catch (e) {
      if (attempt === retries) throw e;
      const wait = Math.min(500 * (attempt + 1), 3000);
      await sleep(wait);
      attempt++;
    }
  }
}

function looksLikeImage(buf) {
  if (!buf || buf.length < 256) return false;
  const isPNG = buf[0] === 0x89 && buf[1] === 0x50;        // ‰P
  const isJPG = buf[0] === 0xFF && buf[1] === 0xD8;       // ÿØ
  const isSVG = buf.toString("utf8", 0, 200).toLowerCase().includes("<svg");
  return isPNG || isJPG || isSVG;
}

async function ensurePng(buffer) {
  // Convierte SVG/JPG a PNG 256x256, y normaliza PNG->PNG
  return await sharp(buffer).resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
}

async function fetchFromTrustWallet(token) {
  // intenta por cada address/mint conocida hasta conseguir una
  const addrs = token.addresses ? Object.entries(token.addresses) : [];
  for (const [chainId, address] of addrs) {
    const url = trustWalletUrl(chainId, address);
    if (!url) continue;
    try {
      const buf = await fetchWithRetry(url);
      if (looksLikeImage(buf)) return { buffer: buf, source: `tw:${chainId}` };
    } catch { /* try next */ }
  }
  // fallback: algunos nativos tienen logo en folder de chain raíz (ej: ethereum/info/logo.png)
  for (const chainId of token.supportedChains || []) {
    const folder = CHAIN_FOLDER[chainId];
    if (!folder) continue;
    const url = `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${folder}/info/logo.png`;
    try {
      const buf = await fetchWithRetry(url);
      if (looksLikeImage(buf)) return { buffer: buf, source: `tw:info:${chainId}` };
    } catch { /* ignore */ }
  }
  return null;
}

async function fetchFromCoinGecko(token) {
  if (!token.coingeckoId) return null;
  const api = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(token.coingeckoId)}`;
  try {
    const json = await fetchWithRetry(api, { asBuffer: false });
    const imgUrl = json?.image?.large || json?.image?.small || json?.image?.thumb;
    if (!imgUrl) return null;
    const buf = await fetchWithRetry(imgUrl);
    if (looksLikeImage(buf)) return { buffer: buf, source: "cg" };
  } catch { /* ignore */ }
  return null;
}

// === Main ===
async function main() {
  const outAbs = path.resolve(OUT_DIR);
  await fs.mkdir(outAbs, { recursive: true });

  const raw = await fs.readFile(CATALOG_PATH, "utf8");
  const tokens = JSON.parse(raw);

  let ok = 0, fail = 0;
  for (const t of tokens) {
    const fileSafeId = String(t.id).replace(/[^\w.-]/g, "_");
    const outFile = path.join(outAbs, `${fileSafeId}.png`);

    // skip si ya existe
    try {
      await fs.access(outFile);
      console.log(`✔️  SKIP ${t.id} (ya existe)`);
      ok++;
      continue;
    } catch {}

    // 1) TrustWallet
    let got = await fetchFromTrustWallet(t);

    // 2) CoinGecko
    if (!got) got = await fetchFromCoinGecko(t);

    // 3) Placeholder si aún no
    if (!got) {
      console.warn(`⚠️  No logo for ${t.id} — using placeholder`);
      // círculo PNG transparente con inicial:
      const placeholder = await sharp({
        create: { width: 256, height: 256, channels: 4, background: { r:255, g:255, b:255, alpha:0 } }
      }).png().toBuffer();
      got = { buffer: placeholder, source: "placeholder" };
    }

    try {
      const png = await ensurePng(got.buffer);
      await fs.writeFile(outFile, png);
      console.log(`✅ Saved ${t.id} from ${got.source}`);
      ok++;
    } catch (e) {
      console.error(`❌ Failed ${t.id}:`, e.message);
      fail++;
    }

    // Rate-limit suave
    await sleep(120);
  }

  console.log(`\n=== DONE ===\nSuccess: ${ok}  |  Failed: ${fail}\nSaved to: ${OUT_DIR}\n`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});