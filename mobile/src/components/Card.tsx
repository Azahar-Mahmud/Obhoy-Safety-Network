import React from 'react';
import { View, Pressable, ViewProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme/theme';

interface CardProps extends Omit<ViewProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}

export function Card({ style, onPress, ...rest }: CardProps) {
  const cardStyle = [styles.card, style];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: colors.ripple }}
        style={({ pressed }) => [
          ...cardStyle,
          pressed && { transform: [{ scale: 0.98 }] }
        ]}
        {...rest as any}
      />
    );
  }

  return <View style={cardStyle} {...rest} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.card,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});