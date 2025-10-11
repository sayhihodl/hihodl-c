// src/hooks/useReceiveAddress.ts
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api"; // tu wrapper fetch
import { useProfileStore } from "@/store/profile";

type ReceiveAddr = {
  address: string;
  address_id: string;
  expires_at?: string;
  provision_more?: boolean;
};

export function useReceiveAddress(
  walletId: string,
  chain: "ethereum" | "base" | "solana",
  token?: string,
  reuse: "current" | "new" = "current"
) {
  const [data, setData] = useState<ReceiveAddr | null>(null);
  const [loading, setLoading] = useState(false);
  const provisionMore = useCallback(async () => {
    // Para Solana: si data.provision_more === true → derivar 20 más y subir batch
    // (usa tu derivador local + POST /wallets/{id}/addresses/batch)
  }, [walletId, chain]);

  const fetchAddr = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ReceiveAddr>(
        `/wallets/${walletId}/receive-address?chain=${chain}` +
          (token ? `&token=${token}` : "") +
          `&reuse_policy=${reuse}`
      );
      setData(res);
      if (res.provision_more && chain === "solana") {
        await provisionMore();
      }
    } finally {
      setLoading(false);
    }
  }, [walletId, chain, token, reuse, provisionMore]);

  useEffect(() => {
    fetchAddr();
  }, [fetchAddr]);

  return { data, loading, refresh: fetchAddr };
}