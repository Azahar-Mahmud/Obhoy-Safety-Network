import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Pressable } from 'react-native';
import { useDiscreetMode } from '../context/DiscreetModeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { t, useLanguage, getLanguage, setLanguage } from '../i18n';
import { syncLanguageToBackend } from '../utils/languageSync';

import { Toggle } from '../components';
import { colors, spacing, typography, radii } from '../theme/theme';
import { isAutoAudioEnabled } from '../utils/autoAudioCapture';

const FALL_DETECTION_KEY = 'obhoy_fall_detection_enabled';
const FALL_SENSITIVITY_KEY = 'obhoy_fall_sensitivity';
const AUTO_AUDIO_KEY = 'obhoy_auto_audio_enabled';

export default function SettingsScreen() {
  useLanguage(); // Hook to trigger re-renders
  const currentLang = getLanguage();
  
  const { discreetModeEnabled, enable, disable } = useDiscreetMode();
  const [busy, setBusy] = useState(false);
  const [fallEnabled, setFallEnabled] = useState(false);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [audioOn, setAudioOn] = useState(false);
  const [silentSosOn, setSilentSosOn] = useState(false);
  const [batteryAlertOn, setBatteryAlertOn] = useState(false);
  
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    SecureStore.getItemAsync(FALL_DETECTION_KEY).then((v) => setFallEnabled(v === 'true'));
    SecureStore.getItemAsync(FALL_SENSITIVITY_KEY).then((v) => {
      if (v === 'low' || v === 'medium' || v === 'high') setSensitivity(v);
    });
    isAutoAudioEnabled().then(setAudioOn);
  }, []);

  const changeLanguage = async (selected: 'bn' | 'en') => {
    if (selected === currentLang) return;
    await setLanguage(selected);
    syncLanguageToBackend();
  };

  const handleDiscreetToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Discreet Mode?',
        'Obhoy will now open as a calculator on your home screen.\n\nType your PIN and press "=" to unlock the app.',
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            onPress: async () => {
              setBusy(true);
              try { await enable(); } catch (e) {} finally { setBusy(false); }
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Me & Settings</Text>

      {/* Profile Card */}
      <Pressable 
        style={styles.profileCard} 
        android_ripple={{ color: colors.ripple }}
        onPress={() => navigation.navigate('MedicalCardEdit')} 
      >
        <View style={styles.avatar}><Text style={{fontSize: 18, fontWeight:'800', color:colors.primary}}>T</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>Tanvir Ahmed</Text>
          <Text style={styles.hint}>+880 1XXX-XXXXXX</Text>
        </View>
        <Feather name="chevron-right" size={20} color={colors.text2} />
      </Pressable>

      {/* Language Toggle */}
      <View style={styles.segCtrl}>
        <Pressable style={[styles.segBtn, currentLang === 'en' && styles.segBtnActive]} onPress={() => changeLanguage('en')}>
          <Text style={[styles.segBtnText, currentLang === 'en' && { color: colors.primary }]}>English</Text>
        </Pressable>
        <Pressable style={[styles.segBtn, currentLang === 'bn' && styles.segBtnActive]} onPress={() => changeLanguage('bn')}>
          <Text style={[styles.segBtnText, currentLang === 'bn' && { color: colors.primary }]}>বাংলা</Text>
        </Pressable>
      </View>

      <Pressable style={styles.ghostBtn} android_ripple={{ color: 'rgba(220,38,38,0.2)' }}>
        <Feather name="pause-circle" size={20} color={colors.danger} />
        <Text style={styles.ghostBtnText}>Pause All Sharing</Text>
      </Pressable>

      <Text style={typography.sectionHeading}>Evidence Vault</Text>
      <Pressable style={styles.card} android_ripple={{ color: colors.ripple }} onPress={() => navigation.navigate('EvidenceGallery')}>
        <View style={styles.row}>
          <Feather name="shield" size={22} color={colors.caution} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Secret Evidence Vault</Text>
            <Text style={styles.hint}>Private storage · 3 clips saved</Text>
          </View>
          <Feather name="chevron-right" size={20} color={colors.text2} />
        </View>
      </Pressable>

      <Text style={typography.sectionHeading}>Safety Network</Text>
      <View style={[styles.card, { paddingVertical: 6, paddingHorizontal: 16 }]}>
        <View style={styles.contactRow}>
          <View style={styles.contactAvatar}><Text style={{fontWeight:'700', color:colors.primary}}>A</Text></View>
          <View><Text style={styles.cardTitle}>Ammu</Text><Text style={styles.hint}>Mother</Text></View>
        </View>
        <View style={styles.contactRow}>
          <View style={styles.contactAvatar}><Text style={{fontWeight:'700', color:colors.primary}}>R</Text></View>
          <View><Text style={styles.cardTitle}>Rafiq Bhai</Text><Text style={styles.hint}>Brother</Text></View>
        </View>
        <Pressable style={[styles.contactRow, { borderBottomWidth: 0 }]} android_ripple={{ color: colors.ripple }} onPress={() => navigation.navigate('AddContact')}>
          <View style={[styles.contactAvatar, { backgroundColor: colors.inputBg }]}><Text style={{fontWeight:'700', color:colors.text2}}>+</Text></View>
          <Text style={{ fontWeight: '700', fontSize: 14.5, color: colors.primary }}>Add trusted contact</Text>
        </Pressable>
      </View>

      <Text style={typography.sectionHeading}>Preferences</Text>

      {/* SOS Custom Message */}
      <Pressable style={styles.card} android_ripple={{ color: colors.ripple }}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Feather name="message-square" size={22} color={colors.text2} style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.cardTitle}>SOS Alert Message</Text>
              <Text style={styles.hint}>Customize text sent to contacts</Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.text2} />
        </View>
      </Pressable>

      {/* Toggles */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Feather name="eye-off" size={22} color={colors.text2} style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.cardTitle}>Silent SOS</Text>
              <Text style={styles.hint}>No screen, sound, or vibration</Text>
            </View>
          </View>
          <Toggle value={silentSosOn} onChange={setSilentSosOn} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Feather name="mic" size={22} color={colors.text2} style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.cardTitle}>Auto-Record Audio on SOS</Text>
              <Text style={styles.hint}>Records 5 mins in background</Text>
            </View>
          </View>
          <Toggle value={audioOn} onChange={handleAudioToggle} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={[styles.rowBetween, { marginBottom: 12 }]}>
          <View style={styles.row}>
            <Feather name="layout" size={22} color={colors.text2} style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.cardTitle}>Discreet Mode</Text>
              <Text style={styles.hint}>Disguise app as a calculator</Text>
            </View>
          </View>
          <Toggle value={discreetModeEnabled} onChange={handleDiscreetToggle} />
        </View>
        <View style={styles.subRow}>
          <Text style={styles.hint}>Auto-hide on phone lock</Text>
          <Toggle value={true} onChange={() => {}} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Feather name="battery" size={22} color={colors.text2} style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.cardTitle}>Battery-Critical Alert</Text>
              <Text style={styles.hint}>Send location before phone dies</Text>
            </View>
          </View>
          <Toggle value={batteryAlertOn} onChange={setBatteryAlertOn} />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.row}>
            <Feather name="activity" size={22} color={colors.text2} style={{ marginRight: 12 }} />
            <View>
              <Text style={styles.cardTitle}>Fall Detection</Text>
              <Text style={styles.hint}>Detects sudden fall</Text>
            </View>
          </View>
          <Toggle value={fallEnabled} onChange={toggleFallDetection} />
        </View>
        {fallEnabled && (
          <View style={styles.chipRow}>
            {(['low', 'medium', 'high'] as const).map((level) => (
              <Pressable key={level} style={[styles.chip, sensitivity === level && styles.chipActive]} onPress={() => changeSensitivity(level)}>
                <Text style={[styles.chipText, sensitivity === level && styles.chipTextActive]}>{t(`settings.sensitivity_${level}` as any)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 100 },
  screenTitle: { ...typography.screenTitle, marginBottom: 16 },
  
  profileCard: {
    backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card,
    padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 20
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  
  segCtrl: { flexDirection: 'row', backgroundColor: colors.inputBg, borderRadius: radii.md, padding: 3, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radii.sm },
  segBtnActive: { backgroundColor: colors.cardBg, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  segBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.text2 },

  ghostBtn: { backgroundColor: colors.dangerTint, padding: 14, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 8 },
  ghostBtnText: { color: colors.danger, fontWeight: '800', fontSize: 15 },

  card: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 16, marginBottom: 12 },
  cardTitle: { fontWeight: '700', fontSize: 14.5, color: colors.text },
  hint: { fontSize: 13, color: colors.text2, marginTop: 2 },
  
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 12 },
  contactAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.cardBg },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.text2 },
  chipTextActive: { color: '#fff' },
});