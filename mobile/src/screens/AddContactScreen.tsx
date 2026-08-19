import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';
import { ScreenHeader, Card, ListRow, Avatar, Button } from '../components';
import { colors, spacing, typography, radii } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddContact'>;

const SUGGESTED_CONTACTS = [
  { name: 'Saima Akhter', phone: '01711000000', relationship: 'Sister' },
  { name: 'Karim Uncle', phone: '01819000000', relationship: 'Family' },
];

export default function AddContactScreen({ navigation }: Props) {
  useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship] = useState('other');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (overrideName?: string, overridePhone?: string, overrideRel?: string) => {
    setError('');
    const finalName = overrideName || name.trim();
    const finalPhone = overridePhone || phone.trim();
    const finalRel = overrideRel || relationship;

    if (!finalName || !finalPhone) {
      setError('Please enter both name and phone number.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify({ name: finalName, phone: finalPhone, relationship: finalRel }),
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
        title={t('contacts.add_title') || 'Add Contact'} 
        subtitle="Enter contact details manually or pick from quick suggestions." 
      />

      {/* Manual Entry Form */}
      <Card style={styles.formCard}>
        <Text style={styles.inputLabel}>{t('contacts.name') || 'Full Name'}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Rafiq Ahmed"
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>{t('contacts.phone') || 'Phone Number'}</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 01XXXXXXXXX"
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label={loading ? 'Saving...' : t('common.save') || 'Save Contact'}
          variant="primary"
          onPress={() => handleAdd()}
          disabled={loading || !name.trim() || !phone.trim()}
          style={styles.saveBtn}
        />
      </Card>

      {/* Suggested Contacts */}
      <Text style={styles.sectionHeading}>Suggested Contacts</Text>
      <Card style={styles.suggestedCard}>
        {SUGGESTED_CONTACTS.map((item, index) => (
          <React.Fragment key={item.phone}>
            <ListRow
              title={item.name}
              subtitle={`${item.phone} · ${item.relationship}`}
              left={<Avatar initial={item.name[0]} size={42} />}
              right={
                <Button
                  label="Add"
                  variant="outline"
                  onPress={() => handleAdd(item.name, item.phone, item.relationship)}
                  style={styles.quickAddBtn}
                />
              }
            />
            {index < SUGGESTED_CONTACTS.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        ))}
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
  sectionHeading: { ...typography.sectionHeading, fontSize: 16, color: colors.textSecondary, marginBottom: spacing.sm },
  suggestedCard: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  quickAddBtn: { paddingVertical: 6, paddingHorizontal: 16, minHeight: 36 },
  error: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center', fontWeight: '600' },
});