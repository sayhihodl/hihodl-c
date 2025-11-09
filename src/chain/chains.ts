export const CHAINS = {
  ethereum: { rpc: `https://eth-mainnet.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_API_KEY}`, nativeSymbol: 'ETH', nativeDecimals: 18 },
  polygon:  { rpc: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_API_KEY}`, nativeSymbol: 'MATIC', nativeDecimals: 18 },
  base:     { rpc: `https://base-mainnet.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_API_KEY}`, nativeSymbol: 'ETH', nativeDecimals: 18 },
  // Solana: Usa Alchemy si está disponible, sino fallback a Helius
  solana:   { 
    rpc: process.env.EXPO_PUBLIC_ALCHEMY_API_KEY 
      ? `https://solana-mainnet.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_API_KEY}`
      : `https://mainnet.helius-rpc.com/?api-key=${process.env.EXPO_PUBLIC_HELIUS_API_KEY || ''}`, 
    nativeSymbol: 'SOL', 
    nativeDecimals: 9 
  },
} as const;