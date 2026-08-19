import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii } from '../theme/theme';

type PillTone = 'safe' | 'caution' | 'danger' | 'neutral';

const toneStyles: Record<PillTone, { bg: string; text: string }> = {
  safe: { bg: colors.safeTint, text: '#15803D' },
  caution: { bg: colors.cautionTint, text: '#B45309' },
  danger: { bg: colors.dangerTint, text: '#B91C1C' },
  neutral: { bg: '#F3F4F6', text: colors.text2 },
};

export function Pill({ label, tone = 'neutral' }: { label: string; tone?: PillTone }) {
  const t = toneStyles[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      <Text style={[styles.label, { color: t.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 11, 
    paddingVertical: 5, 
    borderRadius: radii.pill, 
    alignSelf: 'flex-start',
    gap: 5
  },
  label: { 
    fontSize: 12.5, 
    fontWeight: '800' 
  },
});