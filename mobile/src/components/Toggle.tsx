import React, { useEffect, useRef } from 'react';
import { Pressable, Animated, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

export function Toggle({ value, onChange }: ToggleProps) {
  const slideAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const trackColor = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', colors.primary] // Use '#4B5563' for dark mode track later
  });

  const knobLeft = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 22]
  });

  return (
    <Pressable 
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.knob, { left: knobLeft }]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { 
    width: 46, 
    height: 27, 
    borderRadius: 14, 
    justifyContent: 'center', 
  },
  knob: { 
    position: 'absolute',
    width: 21, 
    height: 21, 
    borderRadius: 12, 
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 }
  },
});