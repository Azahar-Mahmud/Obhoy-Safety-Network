import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { saveLocalPinVerifier } from '../utils/localPin';
import { syncLanguageToBackend } from '../utils/languageSync';
import { t, useLanguage } from '../i18n';
import { colors, spacing, typography, radii } from '../theme/theme';
import { Button, Card, ScreenHeader } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'SetPin'>;

export default function SetPinScreen({ route }: Props) {
  useLanguage();
  const { phone } = route.params;
  const { signIn } = useAuth();
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetPin = async () => {
    setError('');
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const data = await apiRequest('/auth/signup/set-pin', {
        method: 'POST',
        body: JSON.stringify({ phone, pin }),
      });
      
      await saveLocalPinVerifier(pin);
      syncLanguageToBackend(); 
      // Sign in with real token -> AppNavigator transitions user into Onboarding (Obhoy_50)
      await signIn(data.token);
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.shieldBadge}>
          <Feather name="shield" size={28} color={colors.primary} />
        </View>
        <ScreenHeader 
          title={t('auth.set_pin_title') || 'Set Your Security PIN'} 
          subtitle="Used to log in and unlock the Calculator disguise in Discreet Mode." 
        />
      </View>

      <Card style={styles.card}>
        <Text style={styles.inputLabel}>New PIN (4–6 digits)</Text>
        <TextInput
          style={styles.pinInput}
          placeholder="••••"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={pin}
          onChangeText={setPin}
          autoFocus
        />

        <View style={styles.divider} />

        <Text style={styles.inputLabel}>Confirm New PIN</Text>
        <TextInput
          style={styles.pinInput}
          placeholder="••••"
          placeholderTextColor={colors.textSecondary}
          keyboardType="number-pad"
          secureTextEntry
          maxLength={6}
          value={confirmPin}
          onChangeText={setConfirmPin}
        />
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={loading ? 'Saving...' : t('common.done')}
        onPress={handleSetPin}
        disabled={loading || pin.length < 4 || confirmPin.length < 4}
        style={styles.doneBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, justifyContent: 'center', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: spacing.md },
  shieldBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    elevation: 2,
  },
  card: { padding: spacing.lg, marginBottom: spacing.lg },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  pinInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: spacing.xs,
  },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center', fontWeight: '600' },
  doneBtn: { marginTop: spacing.xs },
});