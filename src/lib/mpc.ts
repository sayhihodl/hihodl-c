// src/lib/mpc.ts
type Provider = 'google'|'apple';

export type MPCWallet = {
  address: string;
  provider: Provider;
  signMessage: (msg: string) => Promise<string>;
  // añade signTx, getAccounts, etc.
};

export async function createOrLoadMPCWallet(opts: { provider: Provider; idToken?: string }) {
  // Opción A: Web3Auth Core (MPC)
  // 1) Inicializa SDK con tu clientId y dApp origin
  // 2) Haz login con Google/Apple (usa expo-auth-session o el adapter nativo)
  // 3) Recupera/deriva la key y saca la address
  // 4) Devuelve adapter con signMessage/signTx

  // Opción B: Magic
  // 1) new Magic(<key>, { network })
  // 2) await magic.oauth.loginWithRedirect('google'|'apple') / loginWithIdToken
  // 3) const accounts = await magic.user.getMetadata()

  return {
    address: '0x…',
    provider: opts.provider,
    signMessage: async (m) => '0xsignature',
  } as MPCWallet;
}