import React, { useState } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { useDiscreetMode } from '../context/DiscreetModeContext';

export default function SettingsScreen() {
  const { discreetModeEnabled, enable, disable } = useDiscreetMode();
  const [busy, setBusy] = useState(false);

  const handleToggle = (value: boolean) => {
    if (value) {
      // 1. Show the Alert FIRST so the user can read the instructions!
      Alert.alert(
        'Enable Discreet Mode?',
        'Obhoy will now open as a calculator on your home screen.\n\nType your PIN and press "=" to unlock the app.\n\nNote: The app will close or refresh to update the icon.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Turn On',
            onPress: async () => {
              setBusy(true);
              try {
                await enable(); // 2. Enable native disguise after user clicks Turn On
              } catch (e) {
                console.error(e);
              } finally {
                setBusy(false);
              }
            },
          },
        ]
      );
    } else {
      // Turning OFF
      setBusy(true);
      disable().finally(() => setBusy(false));
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Discreet Mode</Text>
          <Text style={styles.hint}>
            Disguises Obhoy as a calculator on your home screen and app drawer.
          </Text>
        </View>
        <Switch value={discreetModeEnabled} onValueChange={handleToggle} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  hint: { fontSize: 13, color: '#6B7280', marginTop: 4 },
});