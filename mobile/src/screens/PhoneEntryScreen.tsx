import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, Animated, Dimensions } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';
import { colors, typography, radii, spacing } from '../theme/theme';
import { Button } from '../components/Button';
import Svg, { Path, Circle } from 'react-native-svg';

const { height, width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneEntry'>;

export default function PhoneEntryScreen({ navigation }: Props) {
  useLanguage();
  const [name, setName] = useState(''); // Added Name state per mockup
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Splash Animation States
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Phase 1 (0-2s): Shield only
    // Phase 2 (2s-4s): Slide up, fade in text & spinner
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(logoTranslateY, { toValue: -40, duration: 800, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 800, useNativeDriver: true })
      ]).start();
    }, 2000);

    // Phase 3 (4.5s): Fade entire splash out to reveal Login
    setTimeout(() => {
      Animated.timing(splashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        setShowSplash(false);
      });
    }, 4500);
  }, []);

  const handleContinue = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/signup/start', {
        method: 'POST',
        // Pass name to backend if supported, otherwise just pass phone
        body: JSON.stringify({ phone, name }), 
      });
      navigation.navigate('Otp', { phone: data.phone, otpWindowSeconds: data.otpWindowSeconds });
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        navigation.navigate('LoginPin', { phone });
      } else {
        setError(err.message || t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* NATIVE ANIMATED SPLASH SEQUENCE */}
      {showSplash && (
        <Animated.View style={[styles.splashScreen, { opacity: splashOpacity }]}>
          <Animated.View style={{ transform: [{ translateY: logoTranslateY }], alignItems: 'center' }}>
            <Svg width="90" height="100" viewBox="0 0 100 120" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
              <Path d="M50 5 L10 25 V60 C10 85 45 110 50 115 C55 110 90 85 90 60 V25 Z"/>
              <Path d="M40 45 C40 35 60 35 60 45 C60 55 45 60 45 75" stroke="#fff"/>
              <Circle cx="45" cy="75" r="5" fill="#fff" stroke="none"/>
              <Path d="M60 45 L70 45" /><Path d="M65 40 V80" />
            </Svg>
            
            <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 16 }}>
              <Text style={styles.splashTitle}>অ<Text style={{ fontSize: 26 }}>ভয়</Text></Text>
              <Text style={styles.splashSubtitle}>Obhoy</Text>
              
              {/* Spinner */}
              <View style={{ marginTop: 40 }}>
                <Svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                  <Path d="M12 2 A10 10 0 1 1 2 12" />
                </Svg>
              </View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      )}

      {/* LOGIN CONTENT */}
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarLogo}><Text style={styles.avatarText}>অ</Text></View>
          <Text style={typography.screenTitle}>Obhoy</Text>
        </View>

        <Text style={styles.fieldLabel}>Enter your name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          placeholderTextColor={colors.text2}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.fieldLabel}>{t('auth.phone_title') || 'Enter your phone number'}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('auth.phone_placeholder') || '01XXXXXXXXX'}
          placeholderTextColor={colors.text2}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <View style={{ marginTop: spacing.md }}>
          <Button 
            label={loading ? '...' : t('auth.continue')} 
            onPress={handleContinue} 
            disabled={loading || phone.length < 10} 
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  splashScreen: {
    position: 'absolute', inset: 0, zIndex: 999, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  splashTitle: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: 1, marginBottom: 4 },
  splashSubtitle: { fontSize: 16, fontWeight: '600', color: '#fff', opacity: 0.8 },
  header: { alignItems: 'center', marginBottom: 40 },
  avatarLogo: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.primary },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radii.md, padding: 16, fontSize: 18, color: colors.text,
    marginBottom: spacing.xl, fontWeight: '500',
  },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '600' },
});