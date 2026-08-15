import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { showOverLockScreen, hideOverLockScreen } from '../../modules/lock-screen-display/src';
import { t, useLanguage } from '../i18n';

const MEDICAL_CARD_KEY = 'obhoy_medical_card';
const CONTACTS_CACHE_KEY = 'obhoy_contacts';

type MedicalCard = { bloodType?: string; allergies?: string; notes?: string };
type Contact = { name: string; phone: string };

export default function MedicalCardScreen() {
  useLanguage();
  const [card, setCard] = useState<MedicalCard>({});
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    showOverLockScreen();
    SecureStore.getItemAsync(MEDICAL_CARD_KEY).then((v) => v && setCard(JSON.parse(v)));
    SecureStore.getItemAsync(CONTACTS_CACHE_KEY).then((v) => v && setContacts(JSON.parse(v)));
    return () => hideOverLockScreen();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{t('medical.title')}</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>{t('medical.blood_type')}</Text>
        <Text style={styles.value}>{card.bloodType || '-'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>{t('medical.allergies')}</Text>
        <Text style={styles.value}>{card.allergies || '-'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>{t('medical.notes')}</Text>
        <Text style={styles.value}>{card.notes || '-'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>{t('medical.contacts')}</Text>
        {contacts.length === 0 && <Text style={styles.value}>-</Text>}
        {contacts.map((c, i) => (
          <Text key={i} style={styles.value}>{c.name} — {c.phone}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827', padding: 24, justifyContent: 'center' },
  header: { color: '#DC2626', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
  section: { marginBottom: 24 },
  label: { color: '#9CA3AF', fontSize: 14, marginBottom: 4 },
  value: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
});