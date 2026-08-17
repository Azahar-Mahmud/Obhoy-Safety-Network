import React from 'react';
import { Pressable, Text, StyleSheet, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { colors, radii } from '../theme/theme';
import { useSimpleMode } from '../context/SimpleModeContext';
import { getScaledTokens } from '../theme/simpleModeScale';

type ButtonVariant = 'primary' | 'danger' | 'safe' | 'outline';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
  style?: StyleProp<ViewStyle>;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  primary: { bg: colors.primary, text: '#FFFFFF' },
  danger: { bg: colors.danger, text: '#FFFFFF' },
  safe: { bg: colors.safe, text: '#FFFFFF' },
  outline: { bg: colors.background, text: colors.textPrimary, border: colors.border },
};

export function Button({ label, variant = 'primary', style, ...rest }: ButtonProps) {
  const { simpleMode } = useSimpleMode();
  const { spacing, typography, touchTarget } = getScaledTokens(simpleMode);
  const v = variantStyles[variant];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: v.border ? 1.5 : 0,
          paddingVertical: spacing.lg,
          minHeight: touchTarget.minimum,
        },
        pressed && styles.pressed,
        style,
      ]}
      {...rest}
    >
      <Text style={[styles.label, typography.buttonLabel, { color: v.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { 
    borderRadius: radii.lg, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  pressed: { opacity: 0.85 },
  label: {},
});