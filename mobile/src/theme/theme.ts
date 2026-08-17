export const colors = {
  // Core brand — Doc 1 §7.1
  primary: '#6B21A8',
  primaryLight: '#EDE9FE',
  danger: '#DC2626',      // SOS button only. Never for generic errors, delete actions, or map pins.
  safe: '#16A34A',
  caution: '#D97706',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  background: '#FFFFFF',

  // Derived tints for badges and cards
  primaryTint: '#F5F3FF',
  dangerTint: '#FEE2E2',
  safeTint: '#DCFCE7',
  cautionTint: '#FEF3C7',
  border: '#EDE9FE',
};

export const typography = {
  screenTitle: { fontSize: 24, fontWeight: '700' as const },
  sectionHeading: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 16 * 1.55 }, // Line-height optimized for Bangla script
  buttonLabel: { fontSize: 18, fontWeight: '700' as const },
  emergencyNumber: { fontSize: 28, fontWeight: '700' as const },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radii = { sm: 8, md: 12, lg: 16, pill: 999 };

export const iconSize = { nav: 28, card: 48, simpleMode: 80 };

export const touchTarget = { minimum: 48 };