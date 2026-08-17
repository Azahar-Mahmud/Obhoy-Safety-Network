import { spacing, typography, iconSize, touchTarget } from './theme';

const SCALE = 1.35;       // touch targets and spacing multiplier
const TEXT_SCALE = 1.2;   // body and button text multiplier

export function getScaledTokens(simpleMode: boolean) {
  if (!simpleMode) {
    return { spacing, typography, iconSize, touchTarget };
  }
  return {
    spacing: {
      xs: spacing.xs * SCALE,
      sm: spacing.sm * SCALE,
      md: spacing.md * SCALE,
      lg: spacing.lg * SCALE,
      xl: spacing.xl * SCALE,
      xxl: spacing.xxl * SCALE,
    },
    typography: {
      ...typography,
      body: { 
        ...typography.body, 
        fontSize: typography.body.fontSize * TEXT_SCALE, 
        lineHeight: typography.body.lineHeight * TEXT_SCALE 
      },
      buttonLabel: { 
        ...typography.buttonLabel, 
        fontSize: typography.buttonLabel.fontSize * TEXT_SCALE 
      },
    },
    iconSize: {
      nav: 38,
      card: iconSize.simpleMode,   // 80dp
      simpleMode: iconSize.simpleMode,
    },
    touchTarget: { minimum: 64 },  // 64dp minimum touch target
  };
}