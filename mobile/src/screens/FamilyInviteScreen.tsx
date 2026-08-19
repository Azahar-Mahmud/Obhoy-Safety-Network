import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';

import { ScreenHeader, Card, Button } from '../components';
import { colors, radii, spacing, typography } from '../theme/theme';
import { t, useLanguage } from '../i18n';
import { inviteByPhone } from '../utils/familyLocation';

type Props = NativeStackScreenProps<RootStackParamList, 'FamilyInvite'>;

export default function FamilyInviteScreen({ navigation }: Props) {
  useLanguage();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!phone.trim()) return;
    setBusy(true);
    try {
      const result = await inviteByPhone(phone.trim());
      if (result.invited) {
        Alert.alert(t('family.invite_sent_title') || 'Invite Sent', t('family.invite_sent_body') || 'Your family invite was sent successfully.');
      } else {
        Alert.alert(t('family.not_a_user_title') || 'User Not Registered', t('family.not_a_user_body') || 'The phone number is not registered on Obhoy yet.');
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(t('common.error') || 'Error', err?.message ?? 'Could not send invite.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={t('family.add_member') || 'Invite Family Member'}
        subtitle={t('family.add_hint') || 'Both family members must agree before location sharing becomes active.'}
      />

      <Card style={styles.card}>
        <Text style={styles.inputLabel}>Family Member Phone Number</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="e.g. 017XXXXXXXX"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          autoFocus
        />

        <Button
          label={busy ? 'Sending...' : (t('family.send_invite') || 'Send Invite')}
          variant="primary"
          onPress={submit}
          disabled={busy || phone.trim().length < 6}
          style={styles.submitBtn}
        />
      </Card>

      <View style={styles.infoBox}>
        <Feather name="shield" size={18} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.infoText}>
          {t('family.mutual_note') || 'Family sharing is always mutual. You can pause or revoke sharing at any time.'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { padding: spacing.lg, marginBottom: spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  submitBtn: { marginTop: spacing.xs },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  infoText: { fontSize: 13, color: colors.primary, flex: 1, fontWeight: '500', lineHeight: 18 },
});