import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { useSilentMode } from '../context/SilentModeContext';
import { useTheme } from '../context/ThemeContext';
import { runSilentSos } from '../utils/silentSos';
import { ensureSmsPermission } from '../utils/sos';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';

import { Pill, Card, SosButton, EvidenceCaptureModal, ActiveJourneyBanner } from '../components';
import { spacing, typography, radii } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  useLanguage();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { silentModeEnabled } = useSilentMode();
  const [activeJourney, setActiveJourney] = useState<any>(null);
  const [showEvidenceCapture, setShowEvidenceCapture] = useState(false);
  const [userName, setUserName] = useState<string>('there');
  const [contacts, setContacts] = useState<any[]>([]);

  // Guaranteed safe area padding for Android status bar
  const topPadding = Platform.OS === 'android' 
    ? Math.max(insets.top, (StatusBar.currentHeight || 28)) + 10
    : Math.max(insets.top, 20);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });

  useFocusEffect(
    useCallback(() => {
      apiRequest('/contacts')
        .then((data) => {
          if (Array.isArray(data)) {
            setContacts(data);
            SecureStore.setItemAsync('obhoy_contacts', JSON.stringify(data));
          }
        })
        .catch(() => {});
      
      apiRequest('/journey/active')
        .then(setActiveJourney)
        .catch(() => setActiveJourney(null));

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
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: topPadding }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.bg} 
        translucent 
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* 1. Clean Header Row (No Overlapping Ghost Icons) */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>{today}</Text>
            <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>
              {userName && userName !== 'there' ? `Hi, ${userName}!` : 'Welcome!'}
            </Text>
          </View>
          <Pill 
            label={isJourneyActive ? 'On a journey' : 'At rest'} 
            tone={isJourneyActive ? 'caution' : 'safe'} 
          />
        </View>

        {/* 2. Horizontal Safety Circle Avatars */}
        <View style={styles.safetyCircleSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.safetyCircleHeading, { color: colors.textSecondary }]}>
              YOUR SAFETY CIRCLE
            </Text>
            <Pressable onPress={() => navigation.navigate('ContactsList')}>
              <Text style={[styles.manageLink, { color: colors.primary }]}>Manage ›</Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarStrip}>
            {contacts.map((c, i) => (
              <View key={c._id || i} style={styles.contactBubbleItem}>
                <View style={[styles.avatarBubble, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.avatarBubbleText, { color: colors.primary }]}>
                    {(c.name || '?')[0].toUpperCase()}
                  </Text>
                  <View style={[styles.statusDot, { backgroundColor: colors.safe }]} />
                </View>
                <Text style={[styles.contactBubbleName, { color: colors.textPrimary }]} numberOfLines={1}>
                  {c.name.split(' ')[0]}
                </Text>
              </View>
            ))}

            {/* Add Contact Bubble */}
            {contacts.length < 5 && (
              <Pressable style={styles.contactBubbleItem} onPress={() => navigation.navigate('AddContact')}>
                <View style={[styles.avatarBubble, styles.addAvatarBubble, { borderColor: colors.border }]}>
                  <Feather name="plus" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.contactBubbleName, { color: colors.primary }]}>Add</Text>
              </Pressable>
            )}
          </ScrollView>
        </View>

        {/* 3. Global Active Journey Banner */}
        <ActiveJourneyBanner 
          activeJourney={activeJourney} 
          onPress={() => navigation.navigate('ActiveJourney', {
            journeyId: activeJourney._id,
            checkinIntervalMinutes: activeJourney.checkinIntervalMinutes,
          })}
        />

        {/* 4. Glowing Concentric Hero SOS Button (With Proper Vertical Spacing) */}
        <View style={styles.heroWrap}>
          <SosButton onTrigger={handleSosTrigger} />
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>
            Press & hold 1s for emergency alert
          </Text>
        </View>

        {/* 5. Modern Quick Action Cards */}
        <View style={styles.quickGrid}>
          <Pressable 
            android_ripple={{ color: colors.ripple }}
            style={[styles.quickCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => isJourneyActive 
              ? navigation.navigate('ActiveJourney', { journeyId: activeJourney._id, checkinIntervalMinutes: activeJourney.checkinIntervalMinutes }) 
              : navigation.navigate('JourneySetup')
            }
          >
            <View style={[styles.iconBadge, { backgroundColor: colors.primaryLight }]}>
              <Feather name="navigation" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.quickCardTitle, { color: colors.textPrimary }]}>
              {isJourneyActive ? 'Active Journey' : 'Start Journey'}
            </Text>
            <Text style={[styles.quickCardSubtitle, { color: colors.textSecondary }]}>
              {isJourneyActive ? 'View live route' : 'Auto check-ins'}
            </Text>
          </Pressable>

          <Pressable 
            android_ripple={{ color: colors.ripple }}
            style={[styles.quickCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => setShowEvidenceCapture(true)}
          >
            <View style={[styles.iconBadge, { backgroundColor: colors.cautionTint }]}>
              <Feather name="camera" size={20} color={colors.caution} />
            </View>
            <Text style={[styles.quickCardTitle, { color: colors.textPrimary }]}>Quick Capture</Text>
            <Text style={[styles.quickCardSubtitle, { color: colors.textSecondary }]}>Photo / 3m Video</Text>
          </Pressable>
        </View>

        {/* 6. Family Circle Hub Card on Home */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>FAMILY SHARING</Text>
        <Pressable onPress={() => navigation.navigate('Family')}>
          <Card style={styles.familyCard}>
            <View style={styles.rowBetween}>
              <View style={styles.row}>
                <View style={[styles.iconBadgeSmall, { backgroundColor: colors.primaryLight }]}>
                  <Feather name="users" size={18} color={colors.primary} />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={[styles.familyCardTitle, { color: colors.textPrimary }]}>Family Circle Hub</Text>
                  <Text style={[styles.familyCardSub, { color: colors.textSecondary }]}>
                    Mutual live location & battery status
                  </Text>
                </View>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </Pressable>

        {/* 7. Protection Armed Banner */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>SYSTEM READINESS</Text>
        <Card style={[styles.readinessCard, { backgroundColor: colors.safeTint, borderColor: colors.safe }]}>
          <View style={styles.readinessRow}>
            <View style={[styles.shieldIconCircle, { backgroundColor: colors.safe }]}>
              <Feather name="shield" size={16} color="#FFFFFF" />
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[styles.readinessTitle, { color: '#15803D' }]}>
                4-Layer Protection Armed
              </Text>
              <Text style={[styles.readinessSub, { color: '#166534' }]} numberOfLines={1}>
                Cloud • Cellular SMS • Wi-Fi LAN • Mesh
              </Text>
            </View>
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
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 110 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  dateText: { fontSize: 12.5, fontWeight: '600', marginBottom: 2 },
  greetingTitle: { ...typography.screenTitle, fontSize: 26 },

  // Safety Circle Section
  safetyCircleSection: { marginBottom: spacing.xs },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  safetyCircleHeading: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.8 },
  manageLink: { fontSize: 12, fontWeight: '700' },
  avatarStrip: { flexDirection: 'row', gap: 14, paddingVertical: 2 },
  contactBubbleItem: { alignItems: 'center', width: 56 },
  avatarBubble: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 4,
  },
  addAvatarBubble: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  avatarBubbleText: { fontSize: 16, fontWeight: '800' },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  contactBubbleName: { fontSize: 11.5, fontWeight: '600', textAlign: 'center' },

  // SOS Hero Wrap with Clean Padding
  heroWrap: { alignItems: 'center', marginVertical: spacing.md },
  hintText: { fontSize: 13, fontWeight: '600', marginTop: 14 },
  
  // Quick Actions Grid
  quickGrid: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.md },
  quickCard: {
    flex: 1,
    borderRadius: radii.card,
    padding: spacing.lg,
    borderWidth: 1,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickCardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  quickCardSubtitle: { fontSize: 12, fontWeight: '500' },

  // Family Card on Home
  sectionHeading: { ...typography.sectionHeading, fontSize: 11.5, marginBottom: spacing.xs, marginTop: spacing.sm, letterSpacing: 0.8 },
  familyCard: { padding: spacing.md, marginBottom: spacing.sm, borderRadius: radii.card },
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  iconBadgeSmall: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  familyCardTitle: { fontSize: 15, fontWeight: '800' },
  familyCardSub: { fontSize: 12, marginTop: 2 },

  // Readiness Card
  readinessCard: { padding: spacing.md, borderWidth: 1, borderRadius: radii.card, marginBottom: spacing.xs },
  readinessRow: { flexDirection: 'row', alignItems: 'center' },
  shieldIconCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  readinessTitle: { fontSize: 13.5, fontWeight: '800' },
  readinessSub: { fontSize: 11.5, fontWeight: '600', marginTop: 1, opacity: 0.9 },
});