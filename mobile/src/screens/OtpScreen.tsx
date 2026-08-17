import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export default function OtpScreen({ route, navigation }: Props) {
  useLanguage();
  const { phone, otpWindowSeconds } = route.params;
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(otpWindowSeconds);
  const [error, setError] = useState('');

  const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
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
      <Text style={styles.title}>{t('auth.otp_title')}</Text>
      <Text style={styles.subtitle}>
        {secondsLeft > 0 ? `Waiting for SMS... ${secondsLeft}s` : "Didn't get a code?"}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="6-digit code"
        keyboardType="number-pad"
        value={code}
        onChangeText={setCode}
        maxLength={6}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TouchableOpacity style={styles.button} onPress={() => handleVerify()} disabled={code.length !== 6}>
        <Text style={styles.buttonText}>{t('auth.continue')}</Text>
      </TouchableOpacity>

      {/* --- DEMO MODE SKIP BUTTON --- */}
      {isDemoMode && (
        <TouchableOpacity style={styles.demoSkipButton} onPress={handleDemoSkip}>
          <Text style={styles.demoSkipText}>⚡ Skip Verification (Demo Mode)</Text>
        </TouchableOpacity>
      )}

      {/* Standard timeout fallback */}
      {secondsLeft <= 0 && !isDemoMode && (
        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('SetPin', { phone })}>
          <Text style={styles.skipText}>{t('auth.otp_skip')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#6B7280', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12, textAlign: 'center', letterSpacing: 4, minHeight: 48 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  demoSkipButton: { marginTop: 12, backgroundColor: '#EDE9FE', padding: 14, borderRadius: 8, alignItems: 'center' },
  demoSkipText: { color: '#6B21A8', fontWeight: 'bold', fontSize: 14 },
  skipButton: { marginTop: 16, alignItems: 'center' },
  skipText: { color: '#6B21A8', fontSize: 15, textDecorationLine: 'underline' },
  error: { color: '#DC2626', marginBottom: 12 },
});