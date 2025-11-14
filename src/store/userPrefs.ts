// src/store/userPrefs.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ChainKey = "solana" | "base" | "polygon" | "ethereum";
type TokenId  = "usdc" | "usdt" | "eth" | "sol" | string;
type Account  = "Daily" | "Savings" | "Social";

type UserPrefsState = {
  defaultTokenId?: TokenId;       // ej. "usdc"
  defaultAccount?: Account;       // ej. "Daily"
  setDefaultTokenId: (t?: TokenId) => void;
  setDefaultAccount: (a?: Account) => void;
  threadCompact?: boolean;        // vista compacta en PaymentsThread
  setThreadCompact: (v: boolean) => void;
  // Chain favorita por token (ej: { "usdc": "base", "eth": "ethereum" })
  favoriteChainByToken?: Record<TokenId, ChainKey>;
  setFavoriteChainForToken: (tokenId: TokenId, chain: ChainKey) => void;
};

// Inicializar con USDC en Solana como favorito por defecto
const INITIAL_DEFAULT_TOKEN = "usdc";
const INITIAL_DEFAULT_CHAIN = "solana";

export const useUserPrefs = create<UserPrefsState>()(
  persist(
    (set, get) => ({
      // Por defecto: USDC en Solana (se puede cambiar en ajustes o aprender del comportamiento)
      defaultTokenId: INITIAL_DEFAULT_TOKEN,
      defaultAccount: "Daily",
      setDefaultTokenId: (t?: TokenId) => set({ defaultTokenId: t || INITIAL_DEFAULT_TOKEN }),
      setDefaultAccount: (a?: Account) => set({ defaultAccount: a }),
      threadCompact: false,
      setThreadCompact: (v: boolean) => set({ threadCompact: v }),
      // Por defecto: USDC en Solana como chain favorita
      favoriteChainByToken: { [INITIAL_DEFAULT_TOKEN]: INITIAL_DEFAULT_CHAIN },
      setFavoriteChainForToken: (tokenId: TokenId, chain: ChainKey) =>
        set((state) => ({
          favoriteChainByToken: {
            ...(state.favoriteChainByToken || { [INITIAL_DEFAULT_TOKEN]: INITIAL_DEFAULT_CHAIN }),
            [tokenId.toLowerCase()]: chain,
          },
        })),
    }),
    {
      name: "hihodl-user-prefs",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);