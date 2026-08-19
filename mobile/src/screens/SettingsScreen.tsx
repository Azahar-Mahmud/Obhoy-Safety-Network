import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Pressable, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/AppNavigator';
import { useDiscreetMode } from '../context/DiscreetModeContext';
import { useSilentMode } from '../context/SilentModeContext';
import { isAutoAudioEnabled, getAutoAudioLengthSeconds } from '../utils/autoAudioCapture';
import { t, useLanguage } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';

// Design System Components
import { ScreenHeader, Card, ListRow, Toggle } from '../components';
import { colors, spacing, typography, radii } from '../theme/theme';

const FALL_DETECTION_KEY = 'obhoy_fall_detection_enabled';
const FALL_SENSITIVITY_KEY = 'obhoy_fall_sensitivity';
const AUTO_AUDIO_KEY = 'obhoy_auto_audio_enabled';
const AUTO_AUDIO_LENGTH_KEY = 'obhoy_auto_audio_length_seconds';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
  useLanguage();
  const navigation = useNavigation<NavProp>();
  const { discreetModeEnabled, enable, disable } = useDiscreetMode();
  const { silentModeEnabled, toggleSilentMode } = useSilentMode() as any;

  const [busy, setBusy] = useState(false);
  const [fallEnabled, setFallEnabled] = useState(false);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [audioOn, setAudioOn] = useState(false);
  const [audioLength, setAudioLength] = useState(60);

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
        'Obhoy will now disguise itself as a calculator on your home screen.\n\nEnter your PIN and tap "=" to unlock.\n\nNote: The app will refresh to update the icon.',
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={t('settings.title') || 'Settings'}
        subtitle="Configure emergency triggers, privacy disguise & preferences."
      />

      {/* 1. Language Section */}
      <Text style={styles.sectionHeading}>Language & Appearance</Text>
      <Card style={styles.card}>
        <LanguageToggle />
      </Card>

      {/* 2. Privacy & Disguise */}
      <Text style={styles.sectionHeading}>Privacy & Disguise</Text>
      <Card style={styles.card}>
        <ListRow
          title={t('settings.discreet') || 'Calculator Disguise'}
          subtitle={t('settings.discreet_hint') || 'Disguises Obhoy icon and locks with your PIN'}
          left={<Feather name="eye-off" size={20} color={colors.primary} style={styles.rowIcon} />}
          right={<Toggle value={discreetModeEnabled} onChange={handleDiscreetToggle} />}
        />
      </Card>

      {/* 3. Emergency SOS Automations */}
      <Text style={styles.sectionHeading}>Emergency Automations</Text>
      <Card style={styles.card}>
        {/* Silent Mode */}
        <ListRow
          title="Silent SOS Mode"
          subtitle="Triggers alert without sirens, vibrations, or countdown sounds"
          left={<Feather name="volume-x" size={20} color={colors.primary} style={styles.rowIcon} />}
          right={<Toggle value={silentModeEnabled} onChange={toggleSilentMode} />}
        />

        <View style={styles.divider} />

        {/* Auto Audio Record */}
        <ListRow
          title="Auto-Record Audio on SOS"
          subtitle={audioOn ? `Active — saves ${audioLength}s encrypted audio clip` : 'Off'}
          left={<Feather name="mic" size={20} color={colors.primary} style={styles.rowIcon} />}
          right={<Toggle value={audioOn} onChange={handleAudioToggle} />}
        />

        {audioOn && (
          <View style={styles.chipRow}>
            {[30, 60, 120].map((s) => (
              <Pressable
                key={s}
                style={[styles.chip, audioLength === s && styles.chipActive]}
                onPress={() => handleAudioLength(s)}
              >
                <Text style={[styles.chipText, audioLength === s && styles.chipTextActive]}>
                  {s}s
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* Fall Detection */}
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
                style={[styles.chip, sensitivity === level && styles.chipActive]}
                onPress={() => changeSensitivity(level)}
              >
                <Text style={[styles.chipText, sensitivity === level && styles.chipTextActive]}>
                  {t(`settings.sensitivity_${level}` as any) || level}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </Card>

      {/* 4. Vault, Medical ID & Logs */}
      <Text style={styles.sectionHeading}>Health, Vault & Logs</Text>
      <Card style={styles.card}>
        <ListRow
          title="Evidence Vault"
          subtitle="Encrypted photos, videos & audio clips"
          left={<Feather name="shield" size={20} color={colors.primary} style={styles.rowIcon} />}
          right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
          onPress={() => navigation.navigate('EvidenceGallery' as any)}
        />

        <View style={styles.divider} />

        <ListRow
          title={t('settings.medical_card') || 'Medical ID'}
          subtitle="Blood type, allergies, emergency notes"
          left={<Feather name="heart" size={20} color={colors.primary} style={styles.rowIcon} />}
          right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
          onPress={() => navigation.navigate('MedicalCardEdit')}
        />

        <View style={styles.divider} />

        <ListRow
          title={t('sos.last_alert_title') || 'Last Alert Status'}
          subtitle="View delivery logs from your most recent SOS"
          left={<Feather name="clock" size={20} color={colors.primary} style={styles.rowIcon} />}
          right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
          onPress={() => navigation.navigate('LastAlertStatus')}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + 20 },
  sectionHeading: {
    ...typography.sectionHeading,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },
  card: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  rowIcon: { marginRight: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  chipRow: { flexDirection: 'row', gap: 8, paddingVertical: spacing.xs, marginBottom: spacing.xs },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  chipTextActive: { color: '#FFFFFF' },
});