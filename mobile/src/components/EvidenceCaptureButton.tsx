import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/theme';

interface EvidenceCaptureButtonProps {
  onPress: () => void;
  size?: number;
}

export function EvidenceCaptureButton({ onPress, size = 40 }: EvidenceCaptureButtonProps) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, { width: size, height: size, borderRadius: size / 2 }]}>
      <Feather name="camera" size={size * 0.5} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
});