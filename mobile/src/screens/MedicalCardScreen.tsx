import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { showOverLockScreen, hideOverLockScreen } from '../../modules/lock-screen-display/src';

const MEDICAL_CARD_KEY = 'obhoy_medical_card';
const CONTACTS_CACHE_KEY = 'obhoy_contacts'; // Already populated in the background by your app

type MedicalCard = { bloodType?: string; allergies?: string; notes?: string };
type Contact = { name: string; phone: string };

export default function MedicalCardScreen() {
  const [card, setCard] = useState<MedicalCard>({});
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    // 1. Tell Android to push this screen over the lock screen!
    showOverLockScreen();

    // 2. Fetch the offline data (this works even with zero internet)
    SecureStore.getItemAsync(MEDICAL_CARD_KEY).then((v) => v && setCard(JSON.parse(v)));
    SecureStore.getItemAsync(CONTACTS_CACHE_KEY).then((v) => v && setContacts(JSON.parse(v)));
    
    // 3. Clean up the lock screen override when this screen is destroyed
    return () => hideOverLockScreen();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>MEDICAL EMERGENCY CARD</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Blood Type</Text>
        <Text style={styles.value}>{card.bloodType || 'Not provided'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Allergies</Text>
        <Text style={styles.value}>{card.allergies || 'None listed'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Notes</Text>
        <Text style={styles.value}>{card.notes || 'None'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.label}>Emergency Contacts</Text>
        {contacts.length === 0 && <Text style={styles.value}>None saved</Text>}
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