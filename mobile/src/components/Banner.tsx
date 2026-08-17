import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/theme';

export function Banner({ label, tone = 'caution' }: { label: string; tone?: 'caution' | 'primary' }) {
  const bg = tone === 'primary' ? colors.primaryLight : colors.cautionTint;
  const text = tone === 'primary' ? colors.primary : '#B45309';
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md, marginBottom: spacing.md },
  label: { fontWeight: '700', fontSize: 13.5, textAlign: 'center' },
});