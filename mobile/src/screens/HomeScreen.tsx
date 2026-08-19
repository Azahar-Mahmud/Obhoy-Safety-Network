import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { useSilentMode } from '../context/SilentModeContext';
import { runSilentSos } from '../utils/silentSos';
import { ensureSmsPermission } from '../utils/sos';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';

import { Pill, Card, SosButton, EvidenceCaptureModal, ActiveJourneyBanner } from '../components';
import { colors, spacing, typography, radii } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  useLanguage();
  const { signOut } = useAuth();
  const { silentModeEnabled } = useSilentMode();
  const [activeJourney, setActiveJourney] = useState<any>(null);
  const [showEvidenceCapture, setShowEvidenceCapture] = useState(false);
  const [userName, setUserName] = useState<string>('there');

  // Formatted date header
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

  useFocusEffect(
    useCallback(() => {
      apiRequest('/contacts')
        .then((contacts) => SecureStore.setItemAsync('obhoy_contacts', JSON.stringify(contacts)))
        .catch(() => {});
      
      apiRequest('/journey/active')
        .then(setActiveJourney)
        .catch(() => setActiveJourney(null));

      // Load dynamic user name from secure cache
      SecureStore.getItemAsync('obhoy_user_name')
        .then((name) => {
          if (name && name.trim()) setUserName(name.trim());
        })
        .catch(() => {});
    }, [])
  );

  useEffect(() => {
    Location.requestForegroundPermissionsAsync();
    ensureSmsPermission();
  }, []);

  const handleSosTrigger = () => {
    if (silentModeEnabled) {
      runSilentSos();
    } else {
      navigation.navigate('SosCountdown');
    }
  };

  const isJourneyActive = !!activeJourney;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* 1. Header Section with Dynamic User Greeting */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.dateText}>{today}</Text>
            <Text style={styles.greetingTitle}>
              {userName && userName !== 'there' ? `Hi, ${userName}` : 'Welcome'}
            </Text>
          </View>
          <Pill 
            label={isJourneyActive ? 'On a journey' : 'At rest'} 
            tone={isJourneyActive ? 'caution' : 'safe'} 
          />
        </View>

        {/* 2. Active Journey Banner (if running) */}
        <ActiveJourneyBanner 
          activeJourney={activeJourney} 
          onPress={() => navigation.navigate('ActiveJourney', {
            journeyId: activeJourney._id,
            checkinIntervalMinutes: activeJourney.checkinIntervalMinutes,
          })}
        />

        {/* 3. Hero SOS Button */}
        <View style={styles.heroWrap}>
          <View style={styles.sosRingOuter}>
            <SosButton onTrigger={handleSosTrigger} />
          </View>
          <Text style={styles.hintText}>Hold for 1s, or use volume shortcut</Text>
        </View>

        {/* 4. Quick Actions Grid */}
        <View style={styles.quickGrid}>
          <Pressable 
            android_ripple={{ color: colors.ripple }}
            style={styles.quickCard}
            onPress={() => isJourneyActive 
              ? navigation.navigate('ActiveJourney', { journeyId: activeJourney._id, checkinIntervalMinutes: activeJourney.checkinIntervalMinutes }) 
              : navigation.navigate('JourneySetup')
            }
          >
            <Feather name="navigation" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.quickCardTitle}>
              {isJourneyActive ? 'Active Journey' : 'Start Journey'}
            </Text>
            <Text style={styles.quickCardSubtitle}>
              {isJourneyActive ? 'View live route' : 'Auto check-ins'}
            </Text>
          </Pressable>

          <Pressable 
            android_ripple={{ color: colors.ripple }}
            style={styles.quickCard}
            onPress={() => setShowEvidenceCapture(true)}
          >
            <Feather name="camera" size={24} color={colors.caution} style={{ marginBottom: 8 }} />
            <Text style={styles.quickCardTitle}>Capture Evidence</Text>
            <Text style={styles.quickCardSubtitle}>Photo / 3m Video</Text>
          </Pressable>
        </View>

        {/* 5. Location & Safety Map Card */}
        <Text style={styles.sectionHeading}>Safety & Community</Text>
        <Pressable onPress={() => navigation.navigate('Map')}>
          <Card style={styles.mapCard}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <Feather name="map-pin" size={24} color={colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.mapCardTitle}>Unsafe Zone Map</Text>
                  <Text style={styles.mapCardSubtitle}>Live incidents, heatmaps & safety check-ins</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </Pressable>

      </ScrollView>

      {/* Manual Evidence Capture Modal */}
      <EvidenceCaptureModal
        visible={showEvidenceCapture}
        onClose={() => setShowEvidenceCapture(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  dateText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  greetingTitle: { ...typography.screenTitle, color: colors.textPrimary, fontSize: 24 },
  heroWrap: { alignItems: 'center', marginVertical: spacing.md },
  sosRingOuter: {
    width: 176,
    height: 176,
    borderRadius: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.dangerTint,
    marginBottom: 8,
  },
  hintText: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  quickGrid: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.lg },
  quickCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1,
  },
  quickCardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  quickCardSubtitle: { fontSize: 12, color: colors.textSecondary },
  sectionHeading: { ...typography.sectionHeading, fontSize: 15, color: colors.textSecondary, marginBottom: spacing.sm },
  mapCard: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapCardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  mapCardSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});