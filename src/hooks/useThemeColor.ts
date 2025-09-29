// src/hooks/useThemeColor.ts
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

// Paleta mínima por defecto (ajústala si ya tienes theme propio)
const Colors = {
  light: {
    text: '#111827',
    background: '#FFFFFF',
    tint: '#2563EB',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#111827',
  },
  dark: {
    text: '#F9FAFB',
    background: '#0B1223',
    tint: '#60A5FA',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#F9FAFB',
  },
};

type ColorNames = keyof typeof Colors['light'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorNames
) {
  const theme: Theme = (useColorScheme() as Theme) ?? 'light';
  const colorFromProps = props[theme];
  if (colorFromProps) return colorFromProps;

  return Colors[theme][colorName];
}