import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useSilentMode } from '../context/SilentModeContext';

export default function SilentModeToggle() {
  const { silentModeEnabled, loading, setSilentMode } = useSilentMode();

  if (loading) return null;

  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.label}>Silent SOS</Text>
        <Text style={styles.description}>
          Hold the SOS button 2 seconds to send an alert with no screen, sound, or vibration.
        </Text>
      </View>
      <Switch
        value={silentModeEnabled}
        onValueChange={setSilentMode}
        trackColor={{ false: '#D1D5DB', true: '#6B21A8' }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  textBlock: { flex: 1, marginRight: 12 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  description: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});