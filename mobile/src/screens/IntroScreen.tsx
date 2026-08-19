import React, { useEffect, useRef } from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/theme';

export default function IntroScreen() {
  // Native animation values
  const logoFade = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textSlide = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // 1. Logo scale and fade-in
    Animated.parallel([
      Animated.timing(logoFade, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 45,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Staggered text entrance
    Animated.parallel([
      Animated.timing(textFade, {
        toValue: 1,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
      Animated.timing(textSlide, {
        toValue: 0,
        duration: 500,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* 1. Animated "অ-Shield" Mark */}
      <Animated.View style={{ opacity: logoFade, transform: [{ scale: logoScale }] }}>
        <Image 
          source={require('../../assets/splash-icon.png')} 
          style={styles.mark} 
          resizeMode="contain"
        />
      </Animated.View>

      {/* 2. Animated Wordmark */}
      <Animated.View style={{ opacity: textFade, transform: [{ translateY: textSlide }], alignItems: 'center' }}>
        <Text style={styles.wordmark}>অভয়</Text>
        <Text style={styles.sub}>OBHOY</Text>
      </Animated.View>

      {/* 3. Subtle Spinner */}
      <ActivityIndicator color="#FFFFFF" size="small" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: colors.primary, // Brand Purple #6B21A8
    alignItems: 'center', 
    justifyContent: 'center',
  },
  mark: { 
    width: 108, 
    height: 108, 
    marginBottom: 16,
  },
  wordmark: { 
    color: '#FFFFFF', 
    fontSize: 34, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sub: { 
    color: '#FFFFFF', 
    opacity: 0.85, 
    fontSize: 14, 
    marginTop: 4,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  spinner: { 
    marginTop: 36,
    opacity: 0.9,
  },
});