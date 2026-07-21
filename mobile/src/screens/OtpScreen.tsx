import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export default function OtpScreen({ route, navigation }: Props) {
  const { phone, otpWindowSeconds } = route.params;
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(otpWindowSeconds);
  const [error, setError] = useState('');

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleVerify = async () => {
    setError('');
    try {
      await apiRequest('/auth/signup/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
      });
      navigation.navigate('SetPin', { phone });
    } catch (err: any) {
      setError(err.message || 'Incorrect code.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter the code we sent</Text>
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
      <TouchableOpacity style={styles.button} onPress={handleVerify} disabled={code.length !== 6}>
        <Text style={styles.buttonText}>Verify</Text>
      </TouchableOpacity>
      {secondsLeft <= 0 && (
        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.navigate('SetPin', { phone })}>
          <Text style={styles.skipText}>Set a PIN instead and continue</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#6B7280', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12, textAlign: 'center', letterSpacing: 4 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  skipButton: { marginTop: 16, alignItems: 'center' },
  skipText: { color: '#6B21A8', fontSize: 15, textDecorationLine: 'underline' },
  error: { color: '#DC2626', marginBottom: 12 },
});