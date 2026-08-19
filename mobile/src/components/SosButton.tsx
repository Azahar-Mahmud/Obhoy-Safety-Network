import React from 'react';
import { Pressable, Text, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../theme/theme';
import { useSimpleMode } from '../context/SimpleModeContext';

interface SosButtonProps {
  onTrigger: () => void;
  onPressHelp?: () => void;
  size?: number;
}

export function SosButton({ onTrigger, onPressHelp, size }: SosButtonProps) {
  const { simpleMode } = useSimpleMode();
  const baseSize = size ?? (simpleMode ? 172 : 140);

  return (
    <View style={styles.outerContainer}>
      {/* Outer Ripple Aura 1 */}
      <View
        style={[
          styles.glowRing1,
          { width: baseSize + 60, height: baseSize + 60, borderRadius: (baseSize + 60) / 2 },
        ]}
      />
      
      {/* Middle Ripple Aura 2 */}
      <View
        style={[
          styles.glowRing2,
          { width: baseSize + 30, height: baseSize + 30, borderRadius: (baseSize + 30) / 2 },
        ]}
      />

      {/* Main Hero Shutter Button */}
      <Pressable
        onPress={onPressHelp}
        onLongPress={onTrigger}
        delayLongPress={900}
        style={({ pressed }) => [
          styles.button,
          { width: baseSize, height: baseSize, borderRadius: baseSize / 2 },
          pressed && styles.pressed,
        ]}
      >
        <Feather name="wifi" size={18} color="rgba(255,255,255,0.85)" style={styles.waveIcon} />
        <Text style={[styles.label, simpleMode && styles.labelSimple]}>SOS</Text>
        <Text style={[styles.sublabel, simpleMode && styles.sublabelSimple]}>HOLD 1S</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  glowRing1: {
    position: 'absolute',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  glowRing2: {
    position: 'absolute',
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
  },
  button: {
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.92,
  },
  waveIcon: {
    transform: [{ rotate: '45deg' }],
    marginBottom: -2,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 1,
  },
  labelSimple: {
    fontSize: 34,
  },
  sublabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    opacity: 0.88,
    marginTop: 2,
  },
  sublabelSimple: {
    fontSize: 12,
  },
});