// src/lib/evmToken.ts
import { ethers } from "ethers";

const MIN_ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
];

export type EvmTokenMeta = {
  address: string;   // checksummed
  chainId: string;   // e.g. "eip155:56"
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
};

export async function fetchErc20Meta(
  rpcUrl: string,
  chainId: string,
  rawAddress: string
): Promise<EvmTokenMeta> {
  if (!ethers.isAddress(rawAddress)) {
    throw new Error("Invalid contract address");
  }
  const address = ethers.getAddress(rawAddress); // checksum
  const provider = new ethers.JsonRpcProvider(rpcUrl);

  const code = await provider.getCode(address);
  if (code === "0x") throw new Error("Address has no contract code");

  const erc20 = new ethers.Contract(address, MIN_ERC20_ABI, provider);

  const [name, symbol, decimals] = await Promise.all([
    erc20.name().catch(() => ""),
    erc20.symbol().catch(() => ""),
    erc20.decimals().then((d: number) => Number(d)).catch(() => 18),
  ]);

  if (!Number.isFinite(decimals) || decimals < 0 || decimals > 36) {
    throw new Error("Invalid decimals");
  }

  const twChain =
    chainId === "eip155:1" ? "ethereum" :
    chainId === "eip155:56" ? "smartchain" :
    chainId === "eip155:137" ? "polygon" :
    chainId === "eip155:8453" ? "base" : "";
  const logoURI = twChain
    ? `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${twChain}/assets/${address}/logo.png`
    : undefined;

  return { address, chainId, name, symbol, decimals, logoURI };
}