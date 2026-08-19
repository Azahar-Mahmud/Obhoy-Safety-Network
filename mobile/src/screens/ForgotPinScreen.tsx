import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { saveLocalPinVerifier } from '../utils/localPin';
import { ScreenHeader, Card, Button } from '../components';
import { colors, radii, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPin'>;

export default function ForgotPinScreen({ navigation, route }: Props) {
  const initialPhone = route.params?.phone || '';
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);

  const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

  // Step 1: Send OTP
  const handleStart = async () => {
    setLoading(true);
    try {
      await apiRequest('/auth/forgot-pin/start', { method: 'POST', body: JSON.stringify({ phone }) });
      setStep(2);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send reset code.');
    } finally { setLoading(false); }
  };

  // Step 2: Verify OTP
  const handleVerify = async (codeToVerify = code) => {
    setLoading(true);
    try {
      const res = await apiRequest('/auth/forgot-pin/verify', { method: 'POST', body: JSON.stringify({ phone, code: codeToVerify }) });
      setResetToken(res.resetToken);
      setStep(3);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Incorrect code.');
    } finally { setLoading(false); }
  };

  // Step 3: Set New PIN
  const handleReset = async () => {
    if (newPin !== confirmPin) { Alert.alert('Error', 'PINs do not match.'); return; }
    setLoading(true);
    try {
      await apiRequest('/auth/forgot-pin/reset', { method: 'POST', body: JSON.stringify({ resetToken, newPin }) });
      await saveLocalPinVerifier(newPin); // Update local discreet mode verifier
      Alert.alert('Success', 'Your PIN has been reset. You can now log in.', [
        { text: 'Log In', onPress: () => navigation.navigate('LoginPin', { phone }) }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to reset PIN.');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader 
        title="Reset PIN" 
        subtitle={step === 1 ? "Enter your registered number" : step === 2 ? "Enter the verification code sent via SMS" : "Create your new 4-6 digit PIN"} 
      />

      <Card style={styles.card}>
        {step === 1 && (
          <>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} keyboardType="phone-pad" value={phone} onChangeText={setPhone} autoFocus />
            <Button label={loading ? 'Sending...' : 'Send Reset Code'} onPress={handleStart} disabled={loading || phone.length < 10} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.label}>6-Digit Code</Text>
            <TextInput style={[styles.input, { letterSpacing: 8, textAlign: 'center' }]} keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} autoFocus />
            <Button label={loading ? 'Verifying...' : 'Verify Code'} onPress={() => handleVerify()} disabled={loading || code.length < 6} />
            {isDemoMode && (
              <Button label="⚡ Skip (Demo)" variant="outline" style={{ marginTop: 12 }} onPress={() => { setCode('000000'); handleVerify('000000'); }} />
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.label}>New PIN</Text>
            <TextInput style={[styles.input, { letterSpacing: 8, textAlign: 'center' }]} keyboardType="number-pad" secureTextEntry maxLength={6} value={newPin} onChangeText={setNewPin} autoFocus />
            <Text style={styles.label}>Confirm New PIN</Text>
            <TextInput style={[styles.input, { letterSpacing: 8, textAlign: 'center' }]} keyboardType="number-pad" secureTextEntry maxLength={6} value={confirmPin} onChangeText={setConfirmPin} />
            <Button label={loading ? 'Resetting...' : 'Reset PIN'} onPress={handleReset} disabled={loading || newPin.length < 4 || confirmPin.length < 4} />
          </>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingTop: spacing.xxl },
  card: { padding: spacing.lg },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  input: { backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 14, fontSize: 18, color: colors.textPrimary, marginBottom: spacing.lg },
});