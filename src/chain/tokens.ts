export const TOKENS = {
  ethereum: [
    { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6, symbol: 'USDC', name: 'USD Coin' },
  ],
  polygon: [
    { address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', decimals: 6, symbol: 'USDC', name: 'USD Coin' },
  ],
  base: [
    { address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, symbol: 'USDC', name: 'USD Coin' },
  ],
  solana: [
    { mint: 'Es9vMFrzaCER...USDT', decimals: 6, symbol: 'USDT', name: 'Tether USD' },
    { mint: 'EPjFWdd5Aufq...USDC', decimals: 6, symbol: 'USDC', name: 'USD Coin' },
  ],
} as const;