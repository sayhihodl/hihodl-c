// src/chain/solana.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

export type SolanaTokenMeta = {
  mint: string;
  symbol: string;
  decimals: number;
  name?: string; // ← antes tenías name7
};

export type SplBalance = {
  mint: string;
  raw: string; // unidades mínimas
};

const SOLANA_RPC = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC);

export async function getSolBalance(address: string): Promise<number> {
  try {
    const pk = new PublicKey(address);
    return await connection.getBalance(pk); // lamports
  } catch {
    return 0;
  }
}

export async function getSplBalances(
  address: string,
  tokens: readonly SolanaTokenMeta[],
): Promise<SplBalance[]> {
  try {
    const owner = new PublicKey(address);
    const resp = await connection.getParsedTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID });

    return tokens.map((t) => {
      const acc = resp.value.find(
        (a) => a.account.data.parsed.info.mint === t.mint,
      );
      const raw = acc ? acc.account.data.parsed.info.tokenAmount.amount : '0';
      return { mint: t.mint, raw };
    });
  } catch {
    return tokens.map((t) => ({ mint: t.mint, raw: '0' }));
  }
}

// ✅ re-exports explícitos para que TS los “vea” seguro
export { };