import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { apiRequest } from '../api/client';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const MEDICAL_CARD_KEY = 'obhoy_medical_card';

export default function MedicalCardEditScreen() {
  const [bloodType, setBloodType] = useState('Unknown');
  const [allergies, setAllergies] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch existing data when screen loads
  useEffect(() => {
    apiRequest('/medical-card')
      .then((data) => {
        if (data.bloodType) setBloodType(data.bloodType);
        if (data.allergies) setAllergies(data.allergies);
        if (data.notes) setNotes(data.notes);
      })
      .catch(() => {
        // If offline, we can silently fail here. The local cache is what really matters.
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const card = { bloodType, allergies, notes };
    
    try {
      // 1. Try to sync to the backend
      await apiRequest('/medical-card', { method: 'PUT', body: JSON.stringify(card) });
    } catch {
      // Offline is fine — the local cache below is what actually matters at crash-time.
    }
    
    // 2. Cache locally so the card can render with zero network access — this is the
    // data path that has to work at the exact moment signal might be gone entirely.
    await SecureStore.setItemAsync(MEDICAL_CARD_KEY, JSON.stringify(card));
    
    setSaving(false);
    Alert.alert('Saved', 'Your medical card is up to date.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Blood Type</Text>
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

      <Text style={styles.label}>Allergies</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Penicillin, peanuts"
        value={allergies}
        onChangeText={setAllergies}
        multiline
      />

      <Text style={styles.label}>Other Notes</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Diabetic, takes daily medication"
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save Medical Card'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginTop: 16, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#EDE9FE' },
  chipActive: { backgroundColor: '#6B21A8' },
  chipText: { color: '#6B21A8', fontWeight: 'bold' },
  chipTextActive: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#6B7280', borderRadius: 8, padding: 12, fontSize: 15, minHeight: 60, textAlignVertical: 'top' },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});