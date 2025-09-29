import { router } from 'expo-router';
export const ROUTES = {
  // Onboarding
  splash: '/onboarding/splash',
  welcome: '/onboarding/welcome',
  carousel: '/onboarding/carousel',
  entry: '/onboarding/entry',

  createAccount: '/onboarding/create-account',
  login: '/onboarding/login',
  email: '/onboarding/email',
  username: '/onboarding/username',
  notifications: '/onboarding/notifications',
  security: '/onboarding/security',
  password: '/onboarding/password',
  principal: '/onboarding/principalaccount',
  success: '/onboarding/success',

  // App
  home: '/home',
  send: '/send-receive/send',
  receive: '/send-receive/receive',
} as const;

export type RouteHref = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * Small helpers so screens can call go(ROUTES.somewhere) without importing router everywhere.
 */
export const go = (path: RouteHref) => {
  router.push(path as any);
};

export const goReplace = (path: RouteHref) => {
  router.replace(path as any);
};