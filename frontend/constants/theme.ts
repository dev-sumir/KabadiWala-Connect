/**
 * Kabadiwala Connect Design System Theme
 */

import { Platform } from 'react-native';

const tintColorLight = '#15803D';
const tintColorDark = '#95f8a7';

export const Colors = {
  light: {
    text: '#111827',
    background: '#F8FAF9',
    surface: '#FFFFFF',
    tint: tintColorLight,
    icon: '#6b7280',
    tabIconDefault: '#6b7280',
    tabIconSelected: tintColorLight,
    border: '#E5E7EB',
    primary: '#15803D',
    secondary: '#0284C7',
    tertiary: '#D97706',
    error: '#DC2626',
    successBackground: '#F0FDF4',
    successBorder: '#86EFAC',
    outline: '#6f7a6e',
    surfaceVariant: '#dce2f7',
    onPrimary: '#ffffff',
    onSurfaceVariant: '#3f493f',
  },
  dark: {
    text: '#F9FAFB',
    background: '#111827',
    surface: '#1F2937',
    tint: tintColorDark,
    icon: '#9CA3AF',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: tintColorDark,
    border: '#374151',
    primary: '#95f8a7', // lighter green for dark mode
    secondary: '#38BDF8',
    tertiary: '#FBBF24',
    error: '#EF4444',
    successBackground: '#064E3B',
    successBorder: '#059669',
    outline: '#8E9A8D',
    surfaceVariant: '#3F4940',
    onPrimary: '#003816',
    onSurfaceVariant: '#C3C9C2',
  },
};

export const Spacing = {
  stackUnit: 8,
  gutterCompact: 12,
  gutterComfortable: 16,
  marginScreen: 16,
  cardPadding: 20,
  tapMinimum: 56,
  tapSpacious: 64,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16, // rounded-2xl
  full: 9999,
};

export const Typography = {
  displayCurrency: {
    fontSize: 36,
    fontWeight: '800' as const,
    lineHeight: 44,
  },
  headlineLg: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  headlineLgMobile: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  headlineMd: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 30,
  },
  bodyLg: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 26,
  },
  bodyMd: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  labelAction: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  labelBadge: {
    fontSize: 14,
    fontWeight: '700' as const,
    lineHeight: 20,
  },
  stepperNumeral: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});
