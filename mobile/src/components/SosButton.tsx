import React, { useRef, useState } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/theme';
import { useSimpleMode } from '../context/SimpleModeContext';

interface SosButtonProps {
  onTrigger: () => void;
  size?: number;
}

export function SosButton({ onTrigger, size }: SosButtonProps) {
  const { simpleMode } = useSimpleMode();
  const resolvedSize = size ?? (simpleMode ? 196 : 156);
  
  const [isHolding, setIsHolding] = useState(false);
  const fillAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    setIsHolding(true);
    Animated.timing(fillAnim, {
      toValue: 1,
      duration: 1500, // 1.5 seconds to fill
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        onTrigger();
        resetAnim();
      }
    });
  };

  const handlePressOut = () => {
    if (isHolding) resetAnim();
  };

  const resetAnim = () => {
    setIsHolding(false);
    Animated.timing(fillAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        styles.button,
        { width: resolvedSize, height: resolvedSize, borderRadius: resolvedSize / 2 },
        pressed && styles.pressed,
      ]}
    >
      {/* Animated Dark Fill representing the hold time */}
      <Animated.View style={[styles.holdFill, { height: fillHeight }]} />

      <Text style={[styles.label, simpleMode && styles.labelSimple]}>SOS</Text>
      <Text style={[styles.sublabel, simpleMode && styles.sublabelSimple]}>Press & Hold</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.danger,
    shadowOpacity: 0.42,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
    overflow: 'hidden',
  },
  holdFill: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  label: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', letterSpacing: 0.5, zIndex: 2 },
  labelSimple: { fontSize: 36 },
  sublabel: { color: '#FFFFFF', fontSize: 11.5, fontWeight: '700', opacity: 0.92, marginTop: 2, zIndex: 2 },
  sublabelSimple: { fontSize: 14 },
});