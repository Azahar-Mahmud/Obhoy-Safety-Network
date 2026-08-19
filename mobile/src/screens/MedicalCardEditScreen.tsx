import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Feather } from '@expo/vector-icons';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';
import { colors, radii, spacing, typography } from '../theme/theme';
import { Button } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicalCardEdit'>;

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'];
const MEDICAL_CARD_KEY = 'obhoy_medical_card';

export default function MedicalCardEditScreen({ navigation }: Props) {
  useLanguage();
  const [bloodType, setBloodType] = useState('Unknown');
  const [weight, setWeight] = useState('72');
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
    Alert.alert(t('common.done'), 'Medical card saved successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={colors.text} />
        </Pressable>
        <Text style={typography.screenTitle}>Medical Card</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        <Text style={styles.fieldLabel}>Full Name</Text>
        <TextInput style={styles.input} value="Tanvir Ahmed" editable={false} />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Blood Type</Text>
            {/* Simple visual picker for Blood Type */}
            <View style={styles.chipGrid}>
               {BLOOD_TYPES.slice(0,4).map(bt => (
                 <Pressable key={bt} style={[styles.chip, bloodType === bt && styles.chipActive]} onPress={() => setBloodType(bt)}>
                    <Text style={[styles.chipText, bloodType === bt && styles.chipTextActive]}>{bt}</Text>
                 </Pressable>
               ))}
            </View>
            <View style={[styles.chipGrid, { marginTop: 8 }]}>
               {BLOOD_TYPES.slice(4).map(bt => (
                 <Pressable key={bt} style={[styles.chip, bloodType === bt && styles.chipActive]} onPress={() => setBloodType(bt)}>
                    <Text style={[styles.chipText, bloodType === bt && styles.chipTextActive]}>{bt}</Text>
                 </Pressable>
               ))}
            </View>
          </View>
        </View>

        <Text style={styles.fieldLabel}>Weight (kg)</Text>
        <TextInput style={styles.input} keyboardType="numeric" value={weight} onChangeText={setWeight} />

        <Text style={styles.fieldLabel}>Known Allergies</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          placeholder="e.g. Penicillin, peanuts"
          placeholderTextColor={colors.text2}
          value={allergies}
          onChangeText={setAllergies}
          multiline
        />

        <Text style={styles.fieldLabel}>Current Medications</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          placeholder="e.g. Inhaler, Insulin..."
          placeholderTextColor={colors.text2}
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <Button label={saving ? 'Saving...' : 'Save Details'} onPress={handleSave} disabled={saving} style={{ marginTop: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginTop: 40, marginBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardBg },
  content: { padding: spacing.xl, paddingBottom: 100 },
  
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.text2, marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 14, fontSize: 16, color: colors.text, marginBottom: 8 },
  
  chipGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.cardBg },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.text2 },
  chipTextActive: { color: '#fff' },
});