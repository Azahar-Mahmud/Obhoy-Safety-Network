export const lightColors = {
  // Brand
  primary: '#6B21A8',
  primaryDark: '#581C87',
  primaryLight: '#EDE9FE',
  primaryTint: '#F5F3FF',
  danger: '#DC2626',
  dangerTint: '#FEE2E2',
  safe: '#16A34A',
  safeTint: '#DCFCE7',
  caution: '#D97706',
  cautionTint: '#FEF3C7',
  
  // Base
  bg: '#F7F5FA',
  cardBg: '#FFFFFF',
  inputBg: '#FAFAFB',
  border: '#E5E7EB',
  text: '#111827',
  text2: '#6B7280',
  ripple: 'rgba(0, 0, 0, 0.08)',
};

export const darkColors = {
  ...lightColors,
  bg: '#0F0C16',
  cardBg: '#1A1525',
  inputBg: '#130F1C',
  border: '#2D243F',
  text: '#F3F4F6',
  text2: '#9CA3AF',
  primaryLight: '#3B2D59',
  primaryTint: '#211930',
  ripple: 'rgba(255, 255, 255, 0.1)',
};

// Default export for backwards compatibility
export const colors = lightColors;

export const typography = {
  screenTitle: { fontSize: 23, fontWeight: '800' as const, letterSpacing: -0.2 },
  sectionHeading: { fontSize: 15, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  hint: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  buttonLabel: { fontSize: 18, fontWeight: '800' as const },
  emergencyNumber: { fontSize: 26, fontWeight: '800' as const },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radii = { sm: 8, md: 12, lg: 16, card: 18, pill: 999 };
export const iconSize = { nav: 28, card: 48, simpleMode: 80 };
export const touchTarget = { minimum: 48 };