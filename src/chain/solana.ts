import { Connection, PublicKey } from '@solana/web3.js';
import { logger } from '@/utils/logger';

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const connection = new Connection(SOLANA_RPC);

export async function getSolBalance(address: string): Promise<number> {
  try {
    const pubkey = new PublicKey(address);
    const lamports = await connection.getBalance(pubkey);
    return lamports; // puedes dividir entre LAMPORTS_PER_SOL en el front si quieres en SOL
  } catch (err) {
    logger.error("Error getSolBalance:", err);
    return 0;
  }
}