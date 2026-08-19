import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';
import { ScreenHeader, Card, Button } from '../components';
import { colors, radii, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicalCardEdit'>;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const MEDICAL_CARD_KEY = 'obhoy_medical_card';

export default function MedicalCardEditScreen({ navigation }: Props) {
  useLanguage();
  const [bloodType, setBloodType] = useState('Unknown');
  const [weight, setWeight] = useState('');
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 1. Instant load from local cache
    SecureStore.getItemAsync(MEDICAL_CARD_KEY)
      .then((v) => {
        if (v) {
          const parsed = JSON.parse(v);
          if (parsed.bloodType) setBloodType(parsed.bloodType);
          if (parsed.weight) setWeight(parsed.weight);
          if (parsed.allergies) setAllergies(parsed.allergies);
          if (parsed.notes) setNotes(parsed.notes);
        }
      })
      .catch(() => {});

    // 2. Fetch latest from backend
    apiRequest('/medical-card')
      .then((data) => {
        if (data.bloodType) setBloodType(data.bloodType);
        if (data.weight) setWeight(String(data.weight));
        if (data.allergies) setAllergies(data.allergies);
        if (data.notes) setNotes(data.notes);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const card = { bloodType, weight, allergies, notes };

    try {
      await apiRequest('/medical-card', { method: 'PUT', body: JSON.stringify(card) });
    } catch {}

    await SecureStore.setItemAsync(MEDICAL_CARD_KEY, JSON.stringify(card));

    setSaving(false);
    Alert.alert(
      t('common.done') || 'Saved',
      'Medical card updated successfully.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={t('settings.medical_card') || 'Medical ID'}
        subtitle="Critical medical details accessible to emergency responders and contacts."
      />

      {/* 1. Blood Group Selector Card */}
      <Card style={styles.sectionCard}>
        <Text style={styles.cardHeader}>{t('medical.blood_type') || 'Blood Group'}</Text>
        <View style={styles.chipGrid}>
          {BLOOD_TYPES.map((bt) => (
            <Pressable
              key={bt}
              style={[styles.chip, bloodType === bt && styles.chipActive]}
              onPress={() => setBloodType(bt)}
            >
              <Text style={[styles.chipText, bloodType === bt && styles.chipTextActive]}>
                {bt}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* 2. Medical Details Card */}
      <Card style={styles.sectionCard}>
        <Text style={styles.inputLabel}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="e.g. 65"
          placeholderTextColor={colors.textSecondary}
          value={weight}
          onChangeText={setWeight}
        />

        <Text style={styles.inputLabel}>{t('medical.allergies') || 'Known Allergies'}</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="e.g. Penicillin, Peanuts, Dust"
          placeholderTextColor={colors.textSecondary}
          value={allergies}
          onChangeText={setAllergies}
          multiline
        />

        <Text style={styles.inputLabel}>{t('medical.notes') || 'Current Medications & Medical Notes'}</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="e.g. Asthma Inhaler, Insulin, Heart condition"
          placeholderTextColor={colors.textSecondary}
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </Card>

      <Button
        label={saving ? 'Saving...' : 'Save Details'}
        variant="primary"
        onPress={handleSave}
        disabled={saving}
        style={styles.saveBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionCard: { padding: spacing.lg, marginBottom: spacing.lg },
  cardHeader: { ...typography.sectionHeading, fontSize: 16, color: colors.textPrimary, marginBottom: spacing.md },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    minWidth: 54,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: '#FFFFFF' },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  multilineInput: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { marginTop: spacing.xs },
});