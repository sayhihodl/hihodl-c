export const USE_MPC = true;

export const OAUTH = {
  google: {
    iosClientId:     process.env.EXPO_PUBLIC_GOOGLE_IOS_ID!,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_ID!,
    webClientId:     process.env.EXPO_PUBLIC_GOOGLE_WEB_ID!,
  },
  apple: { enabled: true }, // si vas a usar Sign in with Apple
};

// Proveedor MPC (elige uno y completa)
// export const MPC_PROVIDER: 'web3auth' | 'privy' | 'fireblocks' = 'web3auth';