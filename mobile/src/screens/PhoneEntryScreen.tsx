import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';
import { colors, typography, radii, spacing } from '../theme/theme';
import { Button, Card, ScreenHeader } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneEntry'>;

export default function PhoneEntryScreen({ navigation }: Props) {
  useLanguage();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await apiRequest('/auth/signup/start', {
        method: 'POST',
        body: JSON.stringify({ phone }),
      });
      navigation.navigate('Otp', { phone: data.phone, otpWindowSeconds: data.otpWindowSeconds });
    } catch (err: any) {
      if (err.message?.includes('already registered') || err.message?.includes('log in')) {
        navigation.navigate('LoginPin', { phone });
      } else {
        setError(err.message || t('common.error'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Brand Header Icon */}
      <View style={styles.header}>
        <View style={styles.avatarLogo}>
          <Text style={styles.avatarText}>অ</Text>
        </View>
        <ScreenHeader 
          title="Welcome to Obhoy" 
          subtitle="Enter your phone number to log in or create a secure account." 
        />
      </View>

      <Card style={styles.card}>
        <Text style={styles.fieldLabel}>{t('auth.phone_title') || 'Phone Number'}</Text>
        <View style={styles.phoneInputRow}>
          <View style={styles.countryBadge}>
            <Text style={styles.countryText}>🇧🇩 +880</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder={t('auth.phone_placeholder') || '1XXXXXXXXX'}
            placeholderTextColor={colors.textSecondary}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            autoFocus
          />
        </View>
      </Card>

      <View style={styles.infoBox}>
        <Feather name="shield" size={16} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.infoText}>
          Your phone number is encrypted and only shared with your chosen emergency contacts.
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={loading ? 'Checking...' : t('auth.continue')}
        onPress={handleContinue}
        disabled={loading || phone.length < 6}
        style={styles.continueBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, justifyContent: 'center', flexGrow: 1 },
  header: { alignItems: 'center', marginBottom: spacing.md },
  avatarLogo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    elevation: 2,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: colors.primary },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: '#FFFFFF',
  },
  countryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: colors.primaryLight,
    borderTopLeftRadius: radii.md - 1,
    borderBottomLeftRadius: radii.md - 1,
    borderRightWidth: 1.5,
    borderRightColor: colors.border,
  },
  countryText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  infoText: { fontSize: 13, color: colors.primary, flex: 1, fontWeight: '500', lineHeight: 18 },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center', fontWeight: '600' },
  continueBtn: { marginTop: spacing.sm },
});