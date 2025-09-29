import { Connection, PublicKey } from '@solana/web3.js';

const SOLANA_RPC = process.env.SOLANA_RPC || "https://api.mainnet-beta.solana.com";
const connection = new Connection(SOLANA_RPC);

export async function getSolBalance(address: string): Promise<number> {
  try {
    const pubkey = new PublicKey(address);
    const lamports = await connection.getBalance(pubkey);
    return lamports; // puedes dividir entre LAMPORTS_PER_SOL en el front si quieres en SOL
  } catch (err) {
    console.error("Error getSolBalance:", err);
    return 0;
  }
}