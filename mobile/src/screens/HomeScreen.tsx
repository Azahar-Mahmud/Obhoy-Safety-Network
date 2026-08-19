import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Animated, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/AppNavigator';
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
  const { silentModeEnabled } = useSilentMode();
  const [activeJourney, setActiveJourney] = useState<any>(null);
  const [showEvidenceCapture, setShowEvidenceCapture] = useState(false);

  // Today's Date
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' });

  useFocusEffect(
    useCallback(() => {
      apiRequest('/contacts')
        .then((contacts) => SecureStore.setItemAsync('obhoy_contacts', JSON.stringify(contacts)))
        .catch(() => {});
      
      apiRequest('/journey/active')
        .then(setActiveJourney)
        .catch(() => setActiveJourney(null));
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
        
        {/* Header Section */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.dateText}>{today}</Text>
            <Text style={typography.screenTitle}>{'Hi, Tanvir'}</Text>
          </View>
          <Pill label={isJourneyActive ? 'On a journey' : 'At rest'} tone={isJourneyActive ? 'caution' : 'safe'} />
        </View>

        {/* Global Journey Banner */}
        <ActiveJourneyBanner 
          activeJourney={activeJourney} 
          onPress={() => navigation.navigate('ActiveJourney', {
            journeyId: activeJourney._id,
            checkinIntervalMinutes: activeJourney.checkinIntervalMinutes,
          })}
        />

        {/* Massive SOS Button */}
        <View style={styles.heroWrap}>
          <View style={styles.sosRingOuter}>
            <SosButton onTrigger={handleSosTrigger} />
          </View>
          <Text style={styles.hintText}>Hold for 2s, or press volume keys</Text>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickGrid}>
          <Pressable 
            android_ripple={{ color: colors.ripple }}
            style={styles.quickCard}
            onPress={() => isJourneyActive ? navigation.navigate('ActiveJourney', { journeyId: activeJourney._id, checkinIntervalMinutes: activeJourney.checkinIntervalMinutes }) : navigation.navigate('JourneySetup')}
          >
            <Feather name="navigation" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.quickCardTitle}>Start Journey</Text>
            <Text style={styles.quickCardSubtitle}>Auto check-ins</Text>
          </Pressable>

          <Pressable 
            android_ripple={{ color: colors.ripple }}
            style={styles.quickCard}
            onPress={() => setShowEvidenceCapture(true)}
          >
            <Feather name="video" size={24} color={colors.caution} style={{ marginBottom: 8 }} />
            <Text style={styles.quickCardTitle}>Capture</Text>
            <Text style={styles.quickCardSubtitle}>Photo / Video / Audio</Text>
          </Pressable>
        </View>

        {/* Location Section */}
        <Text style={typography.sectionHeading}>Where you are</Text>
        <Card onPress={() => navigation.navigate('Map')}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <Feather name="map-pin" size={26} color={colors.safe} />
              <View style={{ marginLeft: 12 }}>
                <Text style={[typography.body, { fontWeight: '800' }]}>Dhanmondi, Dhaka</Text>
                <Text style={typography.hint}>Generally safe right now</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={colors.primaryLight} />
          </View>
        </Card>

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
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 100 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  dateText: { ...typography.hint, marginBottom: 2 },
  heroWrap: { alignItems: 'center', marginVertical: spacing.lg },
  sosRingOuter: {
    width: 172, height: 172, borderRadius: 86,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.dangerTint,
    marginBottom: 12
  },
  hintText: { ...typography.hint, marginTop: spacing.sm },
  
  quickGrid: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.xl },
  quickCard: {
    flex: 1, backgroundColor: colors.cardBg, borderRadius: radii.lg, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.border,
  },
  quickCardTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: 2 },
  quickCardSubtitle: { ...typography.hint },

  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});