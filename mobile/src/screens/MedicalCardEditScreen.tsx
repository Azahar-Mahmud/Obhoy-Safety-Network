import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const MEDICAL_CARD_KEY = 'obhoy_medical_card';

export default function MedicalCardEditScreen() {
  useLanguage();
  const [bloodType, setBloodType] = useState('Unknown');
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest('/medical-card')
      .then((data) => {
        if (data.bloodType) setBloodType(data.bloodType);
        if (data.allergies) setAllergies(data.allergies);
        if (data.notes) setNotes(data.notes);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const card = { bloodType, allergies, notes };
    
    try {
      await apiRequest('/medical-card', { method: 'PUT', body: JSON.stringify(card) });
    } catch {}
    
    await SecureStore.setItemAsync(MEDICAL_CARD_KEY, JSON.stringify(card));
    
    setSaving(false);
    Alert.alert(t('common.done'), t('common.done'));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>{t('medical.blood_type')}</Text>
      <View style={styles.chipRow}>
        {BLOOD_TYPES.map((bt) => (
          <TouchableOpacity
            key={bt}
            style={[styles.chip, bloodType === bt && styles.chipActive]}
            onPress={() => setBloodType(bt)}
          >
            <Text style={[styles.chipText, bloodType === bt && styles.chipTextActive]}>{bt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t('medical.allergies')}</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Penicillin, peanuts"
        value={allergies}
        onChangeText={setAllergies}
        multiline
      />

      <Text style={styles.label}>{t('medical.notes')}</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Diabetic, takes daily medication"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? '...' : t('common.save')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 36, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#EDE9FE', justifyContent: 'center' },
  chipActive: { backgroundColor: '#6B21A8' },
  chipText: { color: '#6B21A8', fontWeight: 'bold' },
  chipTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#6B7280', borderRadius: 8, padding: 12, fontSize: 15, minHeight: 60, textAlignVertical: 'top' },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});