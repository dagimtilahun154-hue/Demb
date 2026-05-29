/**
 * Demb Design System — "Serene Equilibrium"
 * Neomorphism-lite, soft UI, pill-shaped, lavender/mint/peach palette
 */

import { Platform } from 'react-native';

// ─── Colors ───────────────────────────────────────────────────
export const Colors = {
  light: {
    primary: '#674bb5',
    primaryLight: '#A78BFA',
    primaryDark: '#4f319c',
    primaryContainer: '#e8ddff',
    onPrimary: '#ffffff',

    secondary: '#1b6b4f',
    secondaryLight: '#A7F3D0',
    secondaryContainer: '#a6f2cf',
    onSecondary: '#ffffff',

    tertiary: '#855316',
    tertiaryLight: '#FDBA74',
    tertiaryContainer: '#ffdcbd',
    onTertiary: '#ffffff',

    background: '#fdf7ff',
    surface: '#ffffff',
    surfaceContainer: '#f2ecf6',
    surfaceContainerLow: '#f8f1fb',
    surfaceContainerHigh: '#ece6f0',
    surfaceDim: '#ded8e2',

    textPrimary: '#1d1a21',
    textSecondary: '#494552',
    textMuted: '#7a7583',

    outline: '#7a7583',
    outlineVariant: '#cac4d4',

    error: '#ba1a1a',
    errorContainer: '#ffdad6',
    onError: '#ffffff',

    success: '#1b6b4f',
    successContainer: '#a6f2cf',

    // Backward compat with expo template
    text: '#1d1a21',
    backgroundElement: '#f2ecf6',
    backgroundSelected: '#ece6f0',

    // Neomorphic helpers
    neomorphicDarkShadow: '#d6cbe2',
    neomorphicLightShadow: '#ffffff',
  },
  dark: {
    primary: '#cebdff',
    primaryLight: '#A78BFA',
    primaryDark: '#674bb5',
    primaryContainer: '#4f319c',
    onPrimary: '#21005e',

    secondary: '#8bd6b4',
    secondaryLight: '#a6f2cf',
    secondaryContainer: '#00513a',
    onSecondary: '#002115',

    tertiary: '#fcb973',
    tertiaryLight: '#ffdcbd',
    tertiaryContainer: '#683c00',
    onTertiary: '#2c1600',

    background: '#1d1a21',
    surface: '#2a2730',
    surfaceContainer: '#322f37',
    surfaceContainerLow: '#292630',
    surfaceContainerHigh: '#3d3a44',
    surfaceDim: '#1d1a21',

    textPrimary: '#e6e0ea',
    textSecondary: '#cac4d4',
    textMuted: '#7a7583',

    outline: '#948f9a',
    outlineVariant: '#494552',

    error: '#ffb4ab',
    errorContainer: '#93000a',
    onError: '#690005',

    success: '#8bd6b4',
    successContainer: '#00513a',

    // Backward compat
    text: '#e6e0ea',
    backgroundElement: '#322f37',
    backgroundSelected: '#3d3a44',

    // Neomorphic helpers
    neomorphicDarkShadow: '#121015',
    neomorphicLightShadow: '#2f2b37',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ─── Typography ───────────────────────────────────────────────
export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'System',
    mono: 'Menlo',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

// ─── Spacing (4px base unit) ──────────────────────────────────
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

// ─── Border Radius ────────────────────────────────────────────
export const Radius = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  full: 9999,
} as const;

// ─── Shadows ──────────────────────────────────────────────────
export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 30,
    elevation: 3,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 4,
  }),
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
  neomorphicCard: (isDark: boolean) => ({
    shadowColor: isDark ? '#121015' : '#d2c7de',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: isDark ? 0.7 : 0.6,
    shadowRadius: 12,
    elevation: 5,
  }),
  neomorphicInner: (isDark: boolean) => ({
    shadowColor: isDark ? '#2f2b37' : '#ffffff',
    shadowOffset: { width: -4, height: -4 },
    shadowOpacity: isDark ? 0.5 : 0.9,
    shadowRadius: 8,
    elevation: 2,
  }),
} as const;

// ─── Layout ───────────────────────────────────────────────────
export const BottomTabInset = Platform.select({ ios: 90, android: 90 }) ?? 90;
export const MaxContentWidth = 800;
