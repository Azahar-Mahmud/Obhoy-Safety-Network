import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';
import { useSimpleMode } from '../context/SimpleModeContext';

interface SosButtonProps {
  onTrigger: () => void;
  onPressHelp?: () => void;
  size?: number;
}

export function SosButton({ onTrigger, onPressHelp, size }: SosButtonProps) {
  const { simpleMode } = useSimpleMode();
  
  // Scales dynamically: 196dp in Simple Mode, 156dp normally
  const resolvedSize = size ?? (simpleMode ? 196 : 156);

  return (
    <Pressable
      onPress={onPressHelp}
      onLongPress={onTrigger}
      delayLongPress={900}
      style={({ pressed }) => [
        styles.button,
        { width: resolvedSize, height: resolvedSize, borderRadius: resolvedSize / 2 },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, simpleMode && styles.labelSimple]}>SOS</Text>
      <Text style={[styles.sublabel, simpleMode && styles.sublabelSimple]}>Hold to send alert</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  label: { color: '#FFFFFF', fontSize: 28, fontWeight: '900', letterSpacing: 0.5 },
  labelSimple: { fontSize: 36 },
  sublabel: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700', opacity: 0.92, marginTop: 4 },
  sublabelSimple: { fontSize: 14 },
});