import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet } from 'react-native';

export default function IntroScreen() {
  return (
    <View style={styles.container}>
      {/* Uses your existing splash-icon asset */}
      <Image 
        source={require('../../assets/splash-icon.png')} 
        style={styles.mark} 
        resizeMode="contain"
      />
      <Text style={styles.wordmark}>অভয়</Text>
      <Text style={styles.sub}>Obhoy</Text>
      <ActivityIndicator color="#FFFFFF" size="small" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#6B21A8', // Brand Purple
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  mark: { 
    width: 100, 
    height: 100, 
    marginBottom: 16 
  },
  wordmark: { 
    color: '#FFFFFF', 
    fontSize: 32, 
    fontWeight: '800',
    letterSpacing: 1
  },
  sub: { 
    color: '#FFFFFF', 
    opacity: 0.85, 
    fontSize: 16, 
    marginTop: 4,
    fontWeight: '600',
    letterSpacing: 0.5
  },
  spinner: { 
    marginTop: 28 
  },
});