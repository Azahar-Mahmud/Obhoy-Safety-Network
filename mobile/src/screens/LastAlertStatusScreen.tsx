import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getLastAlertStatus, LastAlertStatus } from '../utils/lastAlertStatus';

type Props = NativeStackScreenProps<RootStackParamList, 'LastAlertStatus'>;

const CHANNEL_LABELS: Record<string, string> = {
  backend: 'Sent via internet',
  native: 'Sent by SMS',
  lan: 'Sent to nearby Obhoy users (local WiFi)',
  mesh: 'Sent to nearby Obhoy users (Bluetooth)',
  failed: 'Could not be sent',
};

export default function LastAlertStatusScreen({ navigation }: Props) {
  const [status, setStatus] = useState<LastAlertStatus | null>(null);
  const [checked, setChecked] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getLastAlertStatus().then((s) => {
        setStatus(s);
        setChecked(true);
      });
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Last Alert</Text>
      {!checked ? null : !status ? (
        <Text style={styles.subtitle}>No alerts have been sent yet.</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{CHANNEL_LABELS[status.channel] || status.channel}</Text>
          <Text style={styles.label}>Contacts reached</Text>
          <Text style={styles.value}>{status.contactsNotifiedCount}</Text>
          <Text style={styles.label}>Sent at</Text>
          <Text style={styles.value}>{new Date(status.sentAt).toLocaleString()}</Text>
          {status.error ? (
            <>
              <Text style={styles.label}>Note</Text>
              <Text style={styles.value}>{status.error}</Text>
            </>
          ) : null}
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  subtitle: { fontSize: 15, color: '#6B7280' },
  card: { backgroundColor: '#EDE9FE', borderRadius: 8, padding: 16, marginBottom: 24 },
  label: { fontSize: 12, color: '#6B7280', marginTop: 10 },
  value: { fontSize: 16, color: '#111827', fontWeight: '600' },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 'auto' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});