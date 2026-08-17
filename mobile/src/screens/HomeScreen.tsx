import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Alert } from 'react-native';
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

// Obhoy_38 Shared Design Components
import { 
  ScreenHeader, 
  Card, 
  Pill, 
  SosButton, 
  ActiveJourneyBanner, 
  ListRow 
} from '../components';
import { colors, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  useLanguage();
  const { signOut } = useAuth();
  const { silentModeEnabled } = useSilentMode();
  const [activeJourney, setActiveJourney] = useState<any>(null);

  // Sync contacts and active journey on screen focus
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

  // --- SOS TRIGGER LOGIC ---
  const handleSosTrigger = () => {
    if (silentModeEnabled) {
      runSilentSos();
    } else {
      navigation.navigate('SosCountdown');
    }
  };

  const handleSosPressHelp = () => {
    Alert.alert('Obhoy SOS', 'Press and hold the SOS button for 1 second to trigger an emergency alert.');
  };

  const isJourneyActive = !!activeJourney;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {/* 1. Header with dynamic status pill */}
      <ScreenHeader 
        title="Obhoy"
        subtitle={isJourneyActive ? 'Journey in progress' : 'Protected & ready'}
        right={
          <Pill 
            label={isJourneyActive ? 'On a journey' : 'At rest'} 
            tone={isJourneyActive ? 'caution' : 'safe'} 
          />
        } 
      />

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
        <SosButton onTrigger={handleSosTrigger} onPressHelp={handleSosPressHelp} />
      </View>

      {/* 4. Journey Card */}
      <Pressable 
        onPress={() => {
          if (isJourneyActive) {
            navigation.navigate('ActiveJourney', {
              journeyId: activeJourney._id,
              checkinIntervalMinutes: activeJourney.checkinIntervalMinutes,
            });
          } else {
            navigation.navigate('JourneySetup');
          }
        }}
      >
        <Card>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{t('home.journey')}</Text>
            <Feather name={isJourneyActive ? 'navigation' : 'arrow-right'} size={20} color={colors.primary} />
          </View>
          <Text style={styles.cardSubtitle}>
            {isJourneyActive 
              ? `Headed to ${activeJourney.destinationLabel || 'destination'} — tap to check in`
              : 'Set destination, automated check-ins & safe zones'}
          </Text>
        </Card>
      </Pressable>

      {/* 5. Safety Map Card */}
      <Pressable onPress={() => navigation.navigate('Map')}>
        <Card>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>{t('home.map')}</Text>
            <Feather name="map-pin" size={20} color={colors.primary} />
          </View>
          <Text style={styles.cardSubtitle}>
            View safety heatmaps, community check-ins & live incident alerts
          </Text>
        </Card>
      </Pressable>

      {/* 6. Essential Actions Card */}
      <Card>
        <ListRow 
          title={t('home.contacts')}
          subtitle="Manage trusted contacts & SMS alerts"
          left={<Feather name="users" size={20} color={colors.primary} style={styles.rowIcon} />}
          right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
          onPress={() => navigation.navigate('ContactsList')}
        />
        <View style={styles.divider} />
        <ListRow 
          title={t('home.directory')}
          subtitle="999, Women Helpline, Emergency Hotlines"
          left={<Feather name="phone-call" size={20} color={colors.primary} style={styles.rowIcon} />}
          right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
          onPress={() => navigation.navigate('Directory')}
        />
        <View style={styles.divider} />
        <ListRow 
          title={t('home.nearby_alerts')}
          subtitle="View local security notifications"
          left={<Feather name="bell" size={20} color={colors.primary} style={styles.rowIcon} />}
          right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
          onPress={() => navigation.navigate('NearbyAlerts')}
        />
        <View style={styles.divider} />
        <ListRow 
          title={t('home.settings')}
          subtitle="Language, Discreet Mode, Fall Detection"
          left={<Feather name="settings" size={20} color={colors.primary} style={styles.rowIcon} />}
          right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
          onPress={() => navigation.navigate('Settings')}
        />
      </Card>

      {/* Logout link */}
      <Pressable style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>{t('auth.logout')}</Text>
      </Pressable>

      {/* DISCREET EVIDENCE CAPTURE BUTTON */}
      <Pressable
        style={styles.evidenceButton}
        onLongPress={() => (navigation as any).navigate('EvidenceCapture')}
        delayLongPress={1500}
      >
        <Text style={styles.evidenceButtonText}>⏺</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { 
    padding: spacing.lg, 
    paddingBottom: spacing.xxl, 
    backgroundColor: '#FAFAFA' 
  },
  heroWrap: { 
    alignItems: 'center', 
    marginVertical: spacing.xl 
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardTitle: { 
    ...typography.sectionHeading, 
    color: colors.textPrimary 
  },
  cardSubtitle: { 
    ...typography.body, 
    color: colors.textSecondary 
  },
  rowIcon: {
    marginRight: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  signOutButton: { 
    marginTop: spacing.md, 
    marginBottom: spacing.xxl, 
    alignItems: 'center' 
  },
  signOutText: { 
    color: colors.textSecondary, 
    fontSize: 15,
    fontWeight: '600',
  },
  evidenceButton: { 
    position: 'absolute', 
    bottom: 24, 
    right: 24, 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: '#EDE9FE', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 3,
  },
  evidenceButtonText: { 
    fontSize: 16, 
    color: '#6B7280' 
  },
});