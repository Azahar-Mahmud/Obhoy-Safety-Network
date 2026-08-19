export const lightColors = {
  // Core Brand
  primary: '#6B21A8',
  primaryDark: '#581C87',
  primaryLight: '#F3E8FF',
  primaryTint: '#FAF5FF',
  
  // Emergency Glow & Accents
  danger: '#EF4444',
  dangerDark: '#DC2626',
  dangerTint: '#FEE2E2',
  dangerGlow: 'rgba(239, 68, 68, 0.15)',
  dangerGlowOuter: 'rgba(239, 68, 68, 0.06)',
  
  safe: '#10B981',
  safeTint: '#D1FAE5',
  caution: '#F59E0B',
  cautionTint: '#FEF3C7',
  
  // Text Tokens
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  text: '#111827',
  text2: '#6B7280',

  // Modern Soft Canvas & Surfaces
  background: '#F6F4F9',
  bg: '#F6F4F9',
  cardBg: '#FFFFFF',
  inputBg: '#F9FAFB',
  border: '#EDE8F5',
  ripple: 'rgba(107, 33, 168, 0.06)',
};

export const darkColors = {
  ...lightColors,
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
  text: '#F9FAFB',
  text2: '#9CA3AF',
  
  background: '#0D0A14',
  bg: '#0D0A14',
  cardBg: '#171322',
  inputBg: '#1F1A2E',
  border: '#272038',
  primaryLight: '#2D1B4E',
  primaryTint: '#1B132C',
  ripple: 'rgba(255, 255, 255, 0.08)',
};

export const colors = lightColors;

export const typography = {
  screenTitle: { fontSize: 24, fontWeight: '800' as const, letterSpacing: -0.3 },
  sectionHeading: { fontSize: 13, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.8 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  hint: { fontSize: 12.5, fontWeight: '500' as const, lineHeight: 18 },
  buttonLabel: { fontSize: 16, fontWeight: '700' as const },
  emergencyNumber: { fontSize: 28, fontWeight: '800' as const },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 36 };
export const radii = { sm: 10, md: 14, lg: 20, card: 22, pill: 999 };
export const iconSize = { nav: 24, card: 44, simpleMode: 80 };
export const touchTarget = { minimum: 48 };