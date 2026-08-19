import { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, typography, radii } from '../theme/theme';
import { Button } from '../components';

type Props = NativeStackScreenProps<RootStackParamList, 'AddContact'>;

export default function AddContactScreen({ navigation }: Props) {
  useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleAdd = async (overrideName?: string, overridePhone?: string) => {
    setError('');
    const finalName = overrideName || name;
    const finalPhone = overridePhone || phone;
    
    if (!finalName || !finalPhone) return;

    try {
      await apiRequest('/contacts', {
        method: 'POST',
        body: JSON.stringify({ name: finalName, phone: finalPhone, relationship: 'other' }),
      });
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={typography.screenTitle}>Add Contact</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.fieldLabel}>Manual Entry</Text>
        <TextInput style={styles.input} placeholder={t('contacts.name')} value={name} onChangeText={setName} placeholderTextColor={colors.text2} />
        <TextInput style={styles.input} placeholder={t('contacts.phone')} keyboardType="phone-pad" value={phone} onChangeText={setPhone} placeholderTextColor={colors.text2} />
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <Button label={t('common.save')} onPress={() => handleAdd()} disabled={!name || !phone} style={{ marginBottom: 30 }} />

        <Text style={typography.sectionHeading}>Suggested Contacts</Text>
        <View style={styles.card}>
          <View style={styles.contactRow}>
            <View style={styles.row}>
              <View style={styles.avatar}><Text style={{fontWeight:'700', color:colors.text2}}>S</Text></View>
              <View><Text style={styles.cardTitle}>Saima Akhter</Text><Text style={styles.hint}>+880 1711-XXXXXX</Text></View>
            </View>
            <Button label="Add" variant="outline" style={styles.addBtn} onPress={() => handleAdd('Saima Akhter', '01711000000')} />
          </View>
          <View style={[styles.contactRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.row}>
              <View style={styles.avatar}><Text style={{fontWeight:'700', color:colors.text2}}>K</Text></View>
              <View><Text style={styles.cardTitle}>Karim Uncle</Text><Text style={styles.hint}>+880 1819-XXXXXX</Text></View>
            </View>
            <Button label="Add" variant="outline" style={styles.addBtn} onPress={() => handleAdd('Karim Uncle', '01819000000')} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginTop: 40, marginBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardBg },
  content: { padding: spacing.xl },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.text2, marginBottom: 8 },
  input: { backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 16, fontSize: 16, color: colors.text, marginBottom: 12 },
  error: { color: colors.danger, marginBottom: 12, fontWeight: '600' },
  
  card: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontWeight: '700', fontSize: 14.5, color: colors.text },
  hint: { fontSize: 13, color: colors.text2, marginTop: 2 },
  addBtn: { width: 'auto', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, minHeight: 36 },
});