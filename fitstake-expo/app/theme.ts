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
    primary: '#FF3D00', // Vibrant orange
    secondary: '#00C853', // Success green
    warning: '#FFD600', // Warning yellow
    error: '#D50000', // Error red
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
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
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
  sm: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};
