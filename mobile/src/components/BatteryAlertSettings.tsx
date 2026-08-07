import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Switch, TouchableOpacity, StyleSheet } from 'react-native';
import * as Battery from 'expo-battery';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import {
  getBatteryAlertSettings,
  setBatteryAlertEnabled,
  setBatteryAlertThreshold,
} from '../utils/batteryAlertSettings';
import { enableBatteryAlert, disableBatteryAlert } from '../utils/batteryAlertRegistration';

const THRESHOLD_OPTIONS = [10, 15, 20, 25, 30];

export default function BatteryAlertSettings() {
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(20);
  const [optimizationOn, setOptimizationOn] = useState(false);

  const refresh = useCallback(async () => {
    const settings = await getBatteryAlertSettings();
    setEnabled(settings.enabled);
    setThreshold(settings.thresholdPercent);
    // Check if Xiaomi/Android is restricting our background battery usage
    const isOptOn = await Battery.isBatteryOptimizationEnabledAsync();
    setOptimizationOn(isOptOn);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleToggle = async (value: boolean) => {
    setEnabled(value);
    await setBatteryAlertEnabled(value);
    if (value) {
      await enableBatteryAlert();
    } else {
      await disableBatteryAlert();
    }
  };

  const handleThreshold = async (value: number) => {
    setThreshold(value);
    await setBatteryAlertThreshold(value);
  };

  // Opens the phone's native settings exactly to the page where you can allow background battery usage
  const openBatterySettings = () => {
    IntentLauncher.startActivityAsync('android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS', {
      data: `package:${Constants.expoConfig?.android?.package}`,
    });
  };

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.label}>Battery-Critical Auto-Alert</Text>
          <Text style={styles.description}>
            Send your location automatically before the phone dies.
          </Text>
        </View>
        <Switch value={enabled} onValueChange={handleToggle} trackColor={{ false: '#D1D5DB', true: '#6B21A8' }} />
      </View>

      {enabled && (
        <View style={styles.thresholdRow}>
          {THRESHOLD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.thresholdButton, threshold === opt && styles.thresholdButtonActive]}
              onPress={() => handleThreshold(opt)}
            >
              <Text style={[styles.thresholdText, threshold === opt && styles.thresholdTextActive]}>
                {opt}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {enabled && optimizationOn && (
        <TouchableOpacity style={styles.warning} onPress={openBatterySettings}>
          <Text style={styles.warningText}>
            Battery optimization is on for Obhoy — this may delay the alert. Tap to fix.
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  textBlock: { flex: 1, marginRight: 12 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  description: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  thresholdRow: { flexDirection: 'row', paddingVertical: 10, gap: 8 },
  thresholdButton: { borderWidth: 1, borderColor: '#6B21A8', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  thresholdButtonActive: { backgroundColor: '#6B21A8' },
  thresholdText: { color: '#6B21A8', fontWeight: 'bold' },
  thresholdTextActive: { color: '#fff' },
  warning: { backgroundColor: '#FEF3C7', borderRadius: 8, padding: 12, marginTop: 8, marginBottom: 8 },
  warningText: { color: '#92400E', fontSize: 13 },
});