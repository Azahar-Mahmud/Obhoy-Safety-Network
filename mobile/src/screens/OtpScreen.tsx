import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';
import { colors, typography, radii, spacing } from '../theme/theme';
import { Button } from '../components/Button';
import Svg, { Path } from 'react-native-svg';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export default function OtpScreen({ route, navigation }: Props) {
  useLanguage();
  const { phone, otpWindowSeconds } = route.params;
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(otpWindowSeconds || 30);
  const [error, setError] = useState('');

  const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s: number) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleVerify = async (codeToVerify = code) => {
    setError('');
    try {
      await apiRequest('/auth/signup/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, code: codeToVerify }),
      });
      navigation.navigate('SetPin', { phone });
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  };

  const handleDemoSkip = () => {
    setCode('000000');
    handleVerify('000000');
  };

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth="2.5" strokeLinecap="round">
            <Path d="M15 18l-6-6 6-6"/>
          </Svg>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.fieldLabel}>{t('auth.otp_title') || 'Enter your OTP'}</Text>
        <Text style={styles.hint}>{phone}</Text>
        
        <TextInput
          style={styles.pinInput}
          placeholder="••••••"
          placeholderTextColor={colors.text2}
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
          maxLength={6}
        />

        <View style={styles.waitArea}>
          {secondsLeft > 0 ? (
            <>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.waitText}>Waiting for OTP... {secondsLeft}s</Text>
            </>
          ) : (
            <Text style={[styles.waitText, { color: colors.safe }]}>Check your messages</Text>
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <Button 
          label={t('auth.continue')} 
          onPress={() => handleVerify()} 
          disabled={code.length !== 6} 
          style={{ opacity: code.length === 6 ? 1 : 0.5 }}
        />

        {isDemoMode && (
          <TouchableOpacity style={styles.demoSkipButton} onPress={handleDemoSkip}>
            <Text style={styles.demoSkipText}>⚡ Skip Verification (Demo Mode)</Text>
          </TouchableOpacity>
        )}

        {secondsLeft <= 0 && !isDemoMode && (
          <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('SetPin', { phone })}>
            <Text style={styles.skipText}>{t('auth.otp_skip') || 'Didn\'t get it? Skip for now'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xl },
  subHeader: { position: 'absolute', top: 40, left: 24, zIndex: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardBg },
  content: { flex: 1, justifyContent: 'center' },
  fieldLabel: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6 },
  hint: { fontSize: 14, color: colors.text2, marginBottom: 24, fontWeight: '600' },
  pinInput: {
    backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radii.md, padding: 16, fontSize: 28, color: colors.text,
    textAlign: 'center', letterSpacing: 8, fontWeight: '700', marginBottom: 20, minHeight: 64,
  },
  waitArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 40, marginBottom: 20 },
  waitText: { fontSize: 13, color: colors.text2, fontWeight: '600' },
  demoSkipButton: { marginTop: 16, backgroundColor: colors.primaryLight, padding: 14, borderRadius: radii.md, alignItems: 'center' },
  demoSkipText: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  skipButton: { marginTop: 24, alignItems: 'center' },
  skipText: { color: colors.primary, fontSize: 15, fontWeight: '700', textDecorationLine: 'underline' },
  error: { color: colors.danger, marginBottom: 16, textAlign: 'center', fontWeight: '600' },
});