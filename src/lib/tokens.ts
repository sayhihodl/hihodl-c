import { TokenListProvider, ENV } from "@solana/spl-token-registry";

export async function getTokenLogo(mint: string): Promise<string | null> {
  const provider = new TokenListProvider();
  const container = await provider.resolve();
  const list = container.filterByChainId(ENV.MainnetBeta).getList();
  const token = list.find(t => t.address === mint);
  return token?.logoURI ?? null;
}