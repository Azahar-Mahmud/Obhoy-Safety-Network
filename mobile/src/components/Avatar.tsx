import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

export function Avatar({ initial, size = 42 }: { initial: string; size?: number }) {
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initial, { fontSize: size * 0.36 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.primary, fontWeight: '800' },
});