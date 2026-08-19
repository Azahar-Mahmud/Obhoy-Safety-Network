import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { showOverLockScreen, hideOverLockScreen } from '../../modules/lock-screen-display/src';
import { t, useLanguage } from '../i18n';
import { Card, Button } from '../components';
import { colors, spacing, radii } from '../theme/theme';

const MEDICAL_CARD_KEY = 'obhoy_medical_card';
const CONTACTS_CACHE_KEY = 'obhoy_contacts';

type MedicalCard = { bloodType?: string; weight?: string; allergies?: string; notes?: string };
type Contact = { name: string; phone: string; relationship?: string };

export default function MedicalCardScreen() {
  useLanguage();
  const [card, setCard] = useState<MedicalCard>({});
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    showOverLockScreen();
    SecureStore.getItemAsync(MEDICAL_CARD_KEY).then((v) => v && setCard(JSON.parse(v))).catch(() => {});
    SecureStore.getItemAsync(CONTACTS_CACHE_KEY).then((v) => v && setContacts(JSON.parse(v))).catch(() => {});
    return () => {
      hideOverLockScreen();
    };
  }, []);

  const handleCall999 = () => {
    Linking.openURL('tel:999').catch(() => {});
  };

  const handleCallContact = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Emergency Header Banner */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Feather name="activity" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.headerTitle}>{t('medical.title') || 'EMERGENCY MEDICAL ID'}</Text>
        <Text style={styles.headerSubtitle}>Critical information for first responders</Text>
      </View>

      {/* Blood Group & Weight Hero Card */}
      <Card style={styles.heroCard}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>{t('medical.blood_type') || 'BLOOD GROUP'}</Text>
          <Text style={styles.bloodValue}>{card.bloodType || 'Unknown'}</Text>
        </View>
        {card.weight ? (
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>WEIGHT</Text>
            <Text style={styles.statValue}>{card.weight} kg</Text>
          </View>
        ) : null}
      </Card>

      {/* Allergies Card */}
      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Feather name="alert-triangle" size={18} color={colors.caution} />
          <Text style={styles.cardHeader}>{t('medical.allergies') || 'Allergies'}</Text>
        </View>
        <Text style={styles.cardBody}>{card.allergies || 'No known allergies listed.'}</Text>
      </Card>

      {/* Medications & Notes Card */}
      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Feather name="file-text" size={18} color={colors.primary} />
          <Text style={styles.cardHeader}>{t('medical.notes') || 'Medications & Conditions'}</Text>
        </View>
        <Text style={styles.cardBody}>{card.notes || 'No medications or conditions listed.'}</Text>
      </Card>

      {/* Emergency Contacts Card with Direct Dialing */}
      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Feather name="users" size={18} color={colors.primary} />
          <Text style={styles.cardHeader}>{t('medical.contacts') || 'Emergency Contacts'}</Text>
        </View>
        {contacts.length === 0 ? (
          <Text style={styles.cardBody}>No emergency contacts found.</Text>
        ) : (
          contacts.map((c, i) => (
            <View key={c.phone || i} style={[styles.contactRow, i < contacts.length - 1 && styles.contactDivider]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={styles.contactPhone}>{c.phone}</Text>
              </View>
              <Button
                label="Call"
                variant="primary"
                onPress={() => handleCallContact(c.phone)}
                style={styles.callBtn}
              />
            </View>
          ))
        )}
      </Card>

      {/* Direct 999 Call Button */}
      <Button
        label="📞 Call 999 (National Emergency)"
        variant="danger"
        onPress={handleCall999}
        style={styles.emergencyBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0C16' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { alignItems: 'center', marginBottom: spacing.lg, marginTop: spacing.md },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    elevation: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFFFFF', letterSpacing: 1 },
  headerSubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  heroCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1A1525',
    borderColor: '#2D243F',
    paddingVertical: spacing.lg,
    marginBottom: spacing.md,
  },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5, marginBottom: 4 },
  bloodValue: { fontSize: 32, fontWeight: '900', color: colors.danger },
  statValue: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  card: { backgroundColor: '#1A1525', borderColor: '#2D243F', padding: spacing.md, marginBottom: spacing.md },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  cardHeader: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  cardBody: { fontSize: 15, color: '#D1D5DB', lineHeight: 22 },
  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  contactDivider: { borderBottomWidth: 1, borderBottomColor: '#2D243F' },
  contactName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  contactPhone: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  callBtn: { paddingVertical: 6, paddingHorizontal: 16, minHeight: 36, borderRadius: radii.pill },
  emergencyBtn: { marginTop: spacing.sm, minHeight: 54 },
});