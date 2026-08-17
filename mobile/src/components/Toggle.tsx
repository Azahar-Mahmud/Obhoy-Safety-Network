import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ value, onChange }: ToggleProps) {
  return (
    <Pressable 
      onPress={() => onChange(!value)} 
      style={[styles.track, value && styles.trackOn]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <View style={[styles.knob, value && styles.knobOn]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { 
    width: 48, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#E5E7EB', 
    justifyContent: 'center', 
    padding: 2.5 
  },
  trackOn: { 
    backgroundColor: colors.primary, 
    alignItems: 'flex-end' 
  },
  knob: { 
    width: 23, 
    height: 23, 
    borderRadius: 12, 
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
  knobOn: {},
});