/**
 * FitStake App Theme
 * A centralized theme system with pure blacks and grays
 */

export const colors = {
  // Core colors
  black: '#000000',
  white: '#FFFFFF',

  // Gray scale (pure grays without blue tint)
  gray: {
    50: '#F9F9F9',
    100: '#EDEDED',
    200: '#D3D3D3',
    300: '#B3B3B3',
    400: '#8C8C8C',
    500: '#737373',
    600: '#595959',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0D0D0D',
  },

  // Accent colors
  accent: {
    primary: '#FF4C00', // Vibrant orange
    secondary: '#00DD5F', // Bright green
    warning: '#FFD600', // Warning yellow
    error: '#FF3B30', // Error red
    info: '#0A84FF', // Info blue
    success: '#34C759', // Success color
    purple: '#AF52DE', // Accent purple
  },

  // Status colors with alpha values
  status: {
    active: 'rgba(99, 102, 241, 0.1)',
    completed: 'rgba(16, 185, 129, 0.1)',
    failed: 'rgba(239, 68, 68, 0.1)',
    upcoming: 'rgba(0, 191, 255, 0.1)',
  },

  // Surface colors
  surface: {
    card: '#1A1A1A',
    input: '#262626',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  lg: {
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
};

// Card-specific styling defaults
export const cards = {
  standard: {
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.lg,
    padding: 0,
    ...shadows.md,
  },
  interactive: {
    backgroundColor: colors.surface.card,
    borderRadius: borderRadius.lg,
    padding: 0,
    ...shadows.md,
    activeOpacity: 0.9,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
  cards,
};
