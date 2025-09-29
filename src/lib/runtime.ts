import Constants from 'expo-constants';

export const isExpoGo     = String(Constants.appOwnership) === 'expo';
export const isDevClient  = String(Constants.appOwnership) === 'guest';
export const isStandalone = String(Constants.appOwnership) === 'standalone';