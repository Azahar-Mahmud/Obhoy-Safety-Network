import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, ScrollView, StatusBar, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { useDiscreetMode } from '../context/DiscreetModeContext';
import { useSilentMode } from '../context/SilentModeContext';
import { useTheme } from '../context/ThemeContext';
import { isAutoAudioEnabled, getAutoAudioLengthSeconds } from '../utils/autoAudioCapture';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';

import { ScreenHeader, Card, ListRow, Toggle, Avatar } from '../components';
import { spacing, typography, radii } from '../theme/theme';

const FALL_DETECTION_KEY = 'obhoy_fall_detection_enabled';
const FALL_SENSITIVITY_KEY = 'obhoy_fall_sensitivity';
const AUTO_AUDIO_KEY = 'obhoy_auto_audio_enabled';
const AUTO_AUDIO_LENGTH_KEY = 'obhoy_auto_audio_length_seconds';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { signOut } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { discreetModeEnabled, enable, disable } = useDiscreetMode();
  const { silentModeEnabled, toggleSilentMode } = useSilentMode() as any;

  const topPadding = Platform.OS === 'android' 
    ? Math.max(insets.top, (StatusBar.currentHeight || 28)) + 6
    : Math.max(insets.top, 20);

  const [userName, setUserName] = useState('User');
  const [userPhone, setUserPhone] = useState('+880 1XXXXXXXXX');
  const [contacts, setContacts] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [fallEnabled, setFallEnabled] = useState(false);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [audioOn, setAudioOn] = useState(false);
  const [audioLength, setAudioLength] = useState(60);

  useFocusEffect(
    useCallback(() => {
      apiRequest('/contacts')
        .then((data) => { if (Array.isArray(data)) setContacts(data); })
        .catch(() => {});

      SecureStore.getItemAsync('obhoy_user_name')
        .then((name) => { if (name && name.trim()) setUserName(name.trim()); })
        .catch(() => {});

      SecureStore.getItemAsync('obhoy_user_phone')
        .then((phone) => { if (phone && phone.trim()) setUserPhone(phone.trim()); })
        .catch(() => {});
    }, [])
  );

  useEffect(() => {
    SecureStore.getItemAsync(FALL_DETECTION_KEY).then((v) => setFallEnabled(v === 'true')).catch(() => {});
    SecureStore.getItemAsync(FALL_SENSITIVITY_KEY).then((v) => {
      if (v === 'low' || v === 'medium' || v === 'high') setSensitivity(v);
    }).catch(() => {});
    isAutoAudioEnabled().then(setAudioOn).catch(() => {});
    getAutoAudioLengthSeconds().then(setAudioLength).catch(() => {});
  }, []);

  const handleDiscreetToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Discreet Mode?',
        'Obhoy will disguise itself as a working calculator on your home screen.\n\nEnter your PIN and tap "=" to unlock.',
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: async () => {
              setBusy(true);
              try { await enable(); } catch (e) { console.error(e); } finally { setBusy(false); }
            },
          },
        ]
      );
    } else {
      setBusy(true);
      disable().finally(() => setBusy(false));
    }
  };

  const toggleFallDetection = async (value: boolean) => {
    setFallEnabled(value);
    await SecureStore.setItemAsync(FALL_DETECTION_KEY, String(value));
  };

  const changeSensitivity = async (value: 'low' | 'medium' | 'high') => {
    setSensitivity(value);
    await SecureStore.setItemAsync(FALL_SENSITIVITY_KEY, value);
  };

  const handleAudioToggle = async (value: boolean) => {
    setAudioOn(value);
    await SecureStore.setItemAsync(AUTO_AUDIO_KEY, String(value));
  };

  const handleAudioLength = async (seconds: number) => {
    setAudioLength(seconds);
    await SecureStore.setItemAsync(AUTO_AUDIO_LENGTH_KEY, String(seconds));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: topPadding }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} translucent />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={t('settings.title') || 'Me & Security'}
          subtitle="Manage your profile, safety circle & emergency preferences."
        />

        {/* 1. Profile Hero Card (Clickable) */}
        <Pressable onPress={() => navigation.navigate('ProfileEditor' as any)}>
          <Card style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Avatar initial={userName[0]?.toUpperCase() || 'U'} size={54} />
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={[styles.profileName, { color: colors.textPrimary }]}>{userName}</Text>
                <Text style={[styles.profilePhone, { color: colors.textSecondary }]}>{userPhone}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </Pressable>

        {/* 2. Language & Appearance */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <Card style={styles.card}>
          <LanguageToggle />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ListRow
            title="Dark Theme"
            subtitle={isDark ? 'Deep contrast mode active' : 'Soft daylight theme'}
            left={<Feather name={isDark ? 'moon' : 'sun'} size={20} color={colors.primary} style={styles.rowIcon} />}
            right={<Toggle value={isDark} onChange={toggleTheme} />}
          />
        </Card>

        {/* 3. Safety Network */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>SAFETY NETWORK</Text>
        <Card style={styles.card}>
          <ListRow
            title={t('contacts.title') || 'Trusted Contacts'}
            subtitle={`${contacts.length}/5 contacts set to receive SOS alerts`}
            left={<Feather name="users" size={20} color={colors.primary} style={styles.rowIcon} />}
            right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
            onPress={() => navigation.navigate('ContactsList')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {contacts.length < 5 && (
            <>
              <ListRow
                title="Add Trusted Contact"
                subtitle="Add family or friends who should be alerted"
                left={<Feather name="user-plus" size={20} color={colors.safe} style={styles.rowIcon} />}
                right={<Feather name="plus" size={18} color={colors.safe} />}
                onPress={() => navigation.navigate('AddContact')}
              />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </>
          )}
          <ListRow
            title="Family Circle Hub"
            subtitle="Two-way mutual live location & battery sharing"
            left={<Feather name="shield" size={20} color={colors.primary} style={styles.rowIcon} />}
            right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
            onPress={() => navigation.navigate('Family')}
          />
        </Card>

        {/* 4. Privacy & Disguise */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>PRIVACY & DISGUISE</Text>
        <Card style={styles.card}>
          <ListRow
            title={t('settings.discreet') || 'Calculator Disguise'}
            subtitle={t('settings.discreet_hint') || 'Disguises Obhoy icon and locks with your PIN'}
            left={<Feather name="eye-off" size={20} color={colors.primary} style={styles.rowIcon} />}
            right={<Toggle value={discreetModeEnabled} onChange={handleDiscreetToggle} />}
          />
        </Card>

        {/* 5. Emergency SOS Automations */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>EMERGENCY AUTOMATIONS</Text>
        <Card style={styles.card}>
          <ListRow
            title="Silent SOS Mode"
            subtitle="Triggers alert without sirens, sounds, or vibrations"
            left={<Feather name="volume-x" size={20} color={colors.primary} style={styles.rowIcon} />}
            right={<Toggle value={silentModeEnabled} onChange={toggleSilentMode} />}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* NEW: Custom SOS Message Editor */}
          <ListRow
            title="SOS Message Editor"
            subtitle="Customize the text sent during an emergency"
            left={<Feather name="edit-3" size={20} color={colors.primary} style={styles.rowIcon} />}
            right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
            onPress={() => navigation.navigate('SosMessageEditor' as any)}
          />

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <ListRow
            title="Auto-Record Audio on SOS"
            subtitle={audioOn ? `Active — saves ${audioLength}s encrypted audio` : 'Off'}
            left={<Feather name="mic" size={20} color={colors.primary} style={styles.rowIcon} />}
            right={<Toggle value={audioOn} onChange={handleAudioToggle} />}
          />

          {audioOn && (
            <View style={styles.chipRow}>
              {[30, 60, 120].map((s) => (
                <Pressable
                  key={s}
                  style={[styles.chip, { backgroundColor: colors.primaryLight }, audioLength === s && { backgroundColor: colors.primary }]}
                  onPress={() => handleAudioLength(s)}
                >
                  <Text style={[styles.chipText, { color: colors.primary }, audioLength === s && { color: '#FFFFFF' }]}>
                    {s}s
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <ListRow
            title={t('settings.fall_detection') || 'Fall Detection'}
            subtitle="Detects impact and checks in before alerting contacts"
            left={<Feather name="activity" size={20} color={colors.primary} style={styles.rowIcon} />}
            right={<Toggle value={fallEnabled} onChange={toggleFallDetection} />}
          />

          {fallEnabled && (
            <View style={styles.chipRow}>
              {(['low', 'medium', 'high'] as const).map((level) => (
                <Pressable
                  key={level}
                  style={[styles.chip, { backgroundColor: colors.primaryLight }, sensitivity === level && { backgroundColor: colors.primary }]}
                  onPress={() => changeSensitivity(level)}
                >
                  <Text style={[styles.chipText, { color: colors.primary }, sensitivity === level && { color: '#FFFFFF' }]}>
                    {t(`settings.sensitivity_${level}` as any) || level}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        {/* 6. Vault, Medical ID & Logs */}
        <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>VAULT, HEALTH & LOGS</Text>
        <Card style={styles.card}>
          <ListRow
            title="Evidence Vault"
            subtitle="Encrypted photos, videos & audio clips"
            left={<Feather name="folder" size={20} color={colors.primary} style={styles.rowIcon} />}
            right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
            onPress={() => navigation.navigate('EvidenceGallery')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ListRow
            title={t('settings.medical_card') || 'Medical ID'}
            subtitle="Blood type, allergies, emergency notes"
            left={<Feather name="heart" size={20} color={colors.primary} style={styles.rowIcon} />}
            right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
            onPress={() => navigation.navigate('MedicalCardEdit')}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <ListRow
            title={t('sos.last_alert_title') || 'Last Alert Status'}
            subtitle="View delivery logs from your most recent SOS"
            left={<Feather name="clock" size={20} color={colors.primary} style={styles.rowIcon} />}
            right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
            onPress={() => navigation.navigate('LastAlertStatus')}
          />
        </Card>

        {/* Logout Button */}
        <Pressable 
          style={styles.signOutBtn}
          onPress={() => {
            Alert.alert(
              t('auth.logout') || 'Log Out',
              'Are you sure you want to log out of Obhoy?',
              [
                { text: t('common.cancel') || 'Cancel', style: 'cancel' },
                { text: t('auth.logout') || 'Log Out', style: 'destructive', onPress: signOut },
              ]
            );
          }}
        >
          <Feather name="log-out" size={18} color={colors.danger} style={{ marginRight: 8 }} />
          <Text style={[styles.signOutText, { color: colors.danger }]}>{t('auth.logout') || 'Log Out'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingBottom: 120, paddingTop: spacing.xs },
  profileCard: { padding: spacing.lg, borderRadius: radii.card, marginBottom: spacing.sm },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  profileName: { fontSize: 18, fontWeight: '800' },
  profilePhone: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  sectionHeading: { ...typography.sectionHeading, fontSize: 11.5, marginBottom: spacing.xs, marginTop: spacing.md, letterSpacing: 0.8 },
  card: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginBottom: spacing.xs, borderRadius: radii.card },
  rowIcon: { marginRight: spacing.sm },
  divider: { height: 1, marginVertical: spacing.xs },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: spacing.xs, marginBottom: spacing.xs },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: radii.pill, minHeight: 32, justifyContent: 'center', alignItems: 'center' },
  chipText: { fontWeight: '700', fontSize: 13 },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.xl },
  signOutText: { fontSize: 15, fontWeight: '700' },
});