import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Pressable } from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParamList, 'LoginPin'>;

export default function LoginPinScreen({ route, navigation }: Props) {
  useLanguage();
  const { phone } = route.params;
  const { signIn } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, pin }),
      });
      await saveLocalPinVerifier(pin);
      await signIn(data.token);
      syncLanguageToBackend();
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.lockBadge}>
          <Feather name="lock" size={28} color={colors.primary} />
        </View>
        <ScreenHeader 
          title={t('auth.login_pin_title') || 'Enter Your PIN'} 
          subtitle={`Logging in as ${phone}`} 
        />
      </View>

      <Card style={styles.card}>
        <Text style={styles.inputLabel}>Security PIN</Text>
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
        <Text style={styles.pinHint}>Enter your 4 to 6 digit account PIN</Text>
      </Card>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={loading ? 'Verifying...' : t('auth.continue') || 'Continue'}
        onPress={handleLogin}
        disabled={loading || pin.length < 4}
        style={styles.continueBtn}
      />

      {/* Forgot PIN Link */}
      <Pressable 
        onPress={() => navigation.navigate('ForgotPin', { phone })} 
        style={styles.forgotBtn}
        hitSlop={12}
      >
        <Text style={styles.forgotText}>Forgot PIN?</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, justifyContent: 'center', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: spacing.md },
  lockBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    elevation: 2,
  },
  card: { padding: spacing.xl, alignItems: 'center', marginBottom: spacing.lg },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm, alignSelf: 'flex-start' },
  pinInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 24,
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 10,
    width: '100%',
    marginBottom: spacing.sm,
  },
  pinHint: { fontSize: 13, color: colors.textSecondary },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center', fontWeight: '600' },
  continueBtn: { marginTop: spacing.xs },
  forgotBtn: { alignItems: 'center', marginTop: 24, paddingVertical: 12 },
  forgotText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
});