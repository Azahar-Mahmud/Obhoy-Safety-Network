import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { t, useLanguage } from '../i18n';
import { inviteByPhone } from '../utils/familyLocation';

export default function FamilyInviteScreen({ navigation }: any) {
  useLanguage();
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!phone.trim()) return;
    setBusy(true);
    try {
      const result = await inviteByPhone(phone.trim());
      if (result.invited) {
        Alert.alert(t('family.invite_sent_title'), t('family.invite_sent_body'));
      } else {
        Alert.alert(t('family.not_a_user_title'), t('family.not_a_user_body'));
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.message ?? '');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('family.add_member')}</Text>
      <Text style={styles.hint}>{t('family.add_hint')}</Text>

      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="01XXXXXXXXX"
        keyboardType="phone-pad"
        autoFocus
      />

      <TouchableOpacity style={styles.button} onPress={submit} disabled={busy}>
        <Text style={styles.buttonText}>{t('family.send_invite')}</Text>
      </TouchableOpacity>

      <Text style={styles.mutualNote}>{t('family.mutual_note')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFFFFF' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  hint: { fontSize: 14, color: '#6B7280', marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: '#6B7280', borderRadius: 8,
    paddingHorizontal: 14, minHeight: 52, fontSize: 18, color: '#111827',
  },
  button: {
    backgroundColor: '#6B21A8', borderRadius: 8, minHeight: 52,
    justifyContent: 'center', alignItems: 'center', marginTop: 20,
  },
  buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  mutualNote: { fontSize: 13, color: '#6B7280', marginTop: 24, lineHeight: 20 },
});