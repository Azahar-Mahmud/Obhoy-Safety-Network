import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/AppNavigator';

import { ScreenHeader, Button, Card } from '../../components';
import { colors, spacing, typography } from '../../theme/theme';
import { apiRequest } from '../../api/client';
import { t, useLanguage } from '../../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingContact'>;

export default function OnboardingContactScreen({ navigation }: Props) {
  useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (name.trim() && phone.trim()) {
      setLoading(true);
      try {
        await apiRequest('/contacts', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
        });
      } catch (e) {
        console.warn('[ONBOARDING] Contact save failed:', e);
      } finally {
        setLoading(false);
      }
    }
    navigation.navigate('OnboardingPermissions');
  };

  const hasInput = name.trim().length > 0 && phone.trim().length > 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Add someone you trust"
        subtitle="They will receive instant GPS links and SMS alerts if you ever trigger an emergency."
      />

      <Card>
        <Text style={styles.inputLabel}>Contact Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Ammu, Rafiq, Partner"
          value={name}
          onChangeText={setName}
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 017XXXXXXXX"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor={colors.textSecondary}
        />
      </Card>

      <View style={styles.infoBox}>
        <Feather name="shield" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.infoText}>
          You can add more trusted contacts or change them anytime in Settings.
        </Text>
      </View>

      <View style={styles.buttonGroup}>
        <Button
          label={loading ? 'Saving...' : hasInput ? 'Save & Continue' : 'Skip for now'}
          variant="primary"
          onPress={handleContinue}
          disabled={loading}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: spacing.md,
    marginVertical: spacing.md,
  },
  infoText: { fontSize: 13, color: colors.primary, flex: 1, fontWeight: '500', lineHeight: 18 },
  buttonGroup: { marginTop: 'auto', paddingTop: spacing.lg },
});