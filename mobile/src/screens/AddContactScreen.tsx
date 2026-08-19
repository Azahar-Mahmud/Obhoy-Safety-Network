import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';
import { ScreenHeader, Card, Button } from '../components';
import { colors, spacing, radii } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddContact'>;

export default function AddContactScreen({ navigation }: Props) {
  useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('other');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async () => {
    setError('');
    const finalName = name.trim();
    const finalPhone = phone.trim();

    if (!finalName || !finalPhone) {
      setError('Please enter both name and phone number.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify({ name: finalName, phone: finalPhone, relationship }),
      });
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader 
        title={t('contacts.add_title') || 'Add Trusted Contact'} 
        subtitle="Add a family member or friend who will receive your live GPS link and SMS during an emergency." 
      />

      <Card style={styles.formCard}>
        <Text style={styles.inputLabel}>{t('contacts.name') || 'Contact Name'}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Mother, Partner, Friend"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <Text style={styles.inputLabel}>{t('contacts.phone') || 'Phone Number'}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 017XXXXXXXX"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={loading ? 'Saving...' : t('common.save') || 'Save Contact'}
          variant="primary"
          onPress={handleAdd}
          disabled={loading || !name.trim() || !phone.trim()}
          style={styles.saveBtn}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  formCard: { padding: spacing.lg, marginBottom: spacing.xl },
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
  saveBtn: { marginTop: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center', fontWeight: '600' },
});