import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useDiscreetMode } from '../context/DiscreetModeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as SecureStore from 'expo-secure-store';
import { t, useLanguage } from '../i18n';
import LanguageToggle from '../components/LanguageToggle';
import SilentModeToggle from '../components/SilentModeToggle';
import BatteryAlertSettings from '../components/BatteryAlertSettings';

const FALL_DETECTION_KEY = 'obhoy_fall_detection_enabled';
const FALL_SENSITIVITY_KEY = 'obhoy_fall_sensitivity';
const AUTO_RECORD_KEY = 'obhoy_auto_record_sos';

export default function SettingsScreen() {
  useLanguage();
  const { discreetModeEnabled, enable, disable } = useDiscreetMode();
  const [busy, setBusy] = useState(false);
  const [fallEnabled, setFallEnabled] = useState(false);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [autoRecordEnabled, setAutoRecordEnabled] = useState(false);

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    SecureStore.getItemAsync(FALL_DETECTION_KEY).then((v) => setFallEnabled(v === 'true'));
    SecureStore.getItemAsync(FALL_SENSITIVITY_KEY).then((v) => {
      if (v === 'low' || v === 'medium' || v === 'high') setSensitivity(v);
    });
    SecureStore.getItemAsync(AUTO_RECORD_KEY).then((v) => setAutoRecordEnabled(v === 'true'));
  }, []);

  const handleDiscreetToggle = (value: boolean) => {
    if (value) {
      Alert.alert(
        'Enable Discreet Mode?',
        'Obhoy will now open as a calculator on your home screen.\n\nType your PIN and press "=" to unlock the app.\n\nNote: The app will close or refresh to update the icon.',
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

  const toggleAutoRecord = async (value: boolean) => {
    setAutoRecordEnabled(value);
    await SecureStore.setItemAsync(AUTO_RECORD_KEY, String(value));
  };

  return (
    <ScrollView style={styles.container}>
      {/* 1. Language Toggle at Top */}
      <LanguageToggle />

      <View style={styles.divider} />

      {/* Discreet Mode */}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('settings.discreet')}</Text>
          <Text style={styles.hint}>{t('settings.discreet_hint')}</Text>
        </View>
        <Switch value={discreetModeEnabled} onValueChange={handleDiscreetToggle} disabled={busy} />
      </View>

      <View style={styles.divider} />

      {/* Silent SOS Mode */}
      <SilentModeToggle />

      <View style={styles.divider} />

      {/* Battery Auto-Alert */}
      <BatteryAlertSettings />

      <View style={styles.divider} />

      {/* Auto-record during SOS */}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Auto-record Video during SOS</Text>
          <Text style={styles.hint}>
            Automatically records video & audio locally when an SOS alert is sent.
          </Text>
        </View>
        <Switch value={autoRecordEnabled} onValueChange={toggleAutoRecord} />
      </View>

      <View style={styles.divider} />

      {/* Fall Detection */}
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('settings.fall_detection')}</Text>
          <Text style={styles.hint}>Detects a sudden fall and checks in before alerting contacts.</Text>
        </View>
        <Switch value={fallEnabled} onValueChange={toggleFallDetection} />
      </View>
      
      {fallEnabled && (
        <View style={styles.chipRow}>
          {(['low', 'medium', 'high'] as const).map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.chip, sensitivity === level && styles.chipActive]}
              onPress={() => changeSensitivity(level)}
            >
              <Text style={[styles.chipText, sensitivity === level && styles.chipTextActive]}>
                {t(`settings.sensitivity_${level}` as any)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.divider} />

      {/* Last Alert Status Link */}
      <TouchableOpacity 
        style={styles.settingRow} 
        onPress={() => navigation.navigate('LastAlertStatus')}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('sos.last_alert_title')}</Text>
          <Text style={styles.hint}>View details of your most recent Silent SOS.</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Medical Card */}
      <TouchableOpacity 
        style={styles.settingRow} 
        onPress={() => navigation.navigate('MedicalCardEdit')}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('settings.medical_card')}</Text>
          <Text style={styles.hint}>Update your blood type, allergies, and notes.</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  hint: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  arrow: { fontSize: 24, color: '#9CA3AF', paddingLeft: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { minHeight: 36, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, backgroundColor: '#EDE9FE', justifyContent: 'center' },
  chipActive: { backgroundColor: '#6B21A8' },
  chipText: { color: '#6B21A8', fontWeight: 'bold' },
  chipTextActive: { color: '#fff' },
});