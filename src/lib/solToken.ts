// solToken.ts
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { Metaplex } from "@metaplex-foundation/js";

export type SolTokenMeta = {
  mint: string;
  chainId: "solana:mainnet";
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

export async function fetchSolMintMeta(
  rpcUrl: string,
  mintAddr: string
): Promise<SolTokenMeta> {
  const conn = new Connection(rpcUrl, "confirmed");

  let mintKey: PublicKey;
  try {
    mintKey = new PublicKey(mintAddr);
  } catch {
    throw new Error("Invalid mint address");
  }

  // === SPL Token info ===
  const mintInfo = await getMint(conn, mintKey);
  const decimals = mintInfo.decimals;

  // === Metaplex Metadata (v2 SDK) ===
  let name = "", symbol = "", logoURI: string | undefined;
  try {
    const mx = Metaplex.make(conn);
    const nft = await mx.nfts().findByMint({ mintAddress: mintKey });
    name = nft.name;
    symbol = nft.symbol;
    logoURI = nft.json?.image;
  } catch (e) {
    // fallback manual
  }

  return {
    mint: mintKey.toBase58(),
    chainId: "solana:mainnet",
    name,
    symbol,
    decimals,
    logoURI,
  };
}