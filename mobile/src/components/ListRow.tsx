import React, { ReactNode } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { colors, spacing, touchTarget } from '../theme/theme';

interface ListRowProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  delayLongPress?: number;
}

export function ListRow({
  title,
  subtitle,
  left,
  right,
  onPress,
  onLongPress,
  delayLongPress,
}: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={delayLongPress}
      style={styles.row}
      disabled={!onPress && !onLongPress}
    >
      {left}
      <View style={{ flex: 1, marginLeft: left ? spacing.md : 0 }}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    minHeight: touchTarget.minimum,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});