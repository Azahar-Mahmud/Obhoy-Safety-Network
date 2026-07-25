import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { triggerSos } from '../utils/sos';

type Props = NativeStackScreenProps<RootStackParamList, 'SosCountdown'>;
const COUNTDOWN_SECONDS = 5;

export default function SosCountdownScreen({ navigation }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [sending, setSending] = useState(false);
  const hasFiredRef = useRef(false);

  const fireSos = useCallback(async () => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    setSending(true);

    let contacts = [];
    try {
      // 1. Try to fetch fresh contacts from the server
      contacts = await apiRequest('/contacts');
      await SecureStore.setItemAsync('obhoy_contacts', JSON.stringify(contacts));
    } catch {
      // 2. Fallback: If offline, load cached contacts (or empty array)
      const cached = await SecureStore.getItemAsync('obhoy_contacts');
      if (cached) {
        try {
          contacts = JSON.parse(cached);
        } catch {
          contacts = [];
        }
      }
    }

    try {
      // 3. Trigger SOS fallback chain (Server -> Native SMS -> LAN UDP Broadcast)
      const result = await triggerSos(contacts);
      navigation.replace('SosConfirmation', result);
    } catch (err: any) {
      navigation.replace('SosConfirmation', {
        channel: 'failed',
        contactsNotified: [],
        error: err.message || 'Failed to send SOS.',
      });
    }
  }, [navigation]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      fireSos();
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, fireSos]);

  return (
    <View style={styles.container}>
      {sending ? (
        <Text style={styles.title}>Sending SOS...</Text>
      ) : (
        <>
          <Text style={styles.countdown}>{secondsLeft}</Text>
          <Text style={styles.subtitle}>Sending SOS in {secondsLeft} seconds</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DC2626' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  countdown: { fontSize: 96, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 18, color: '#fff', marginTop: 8, marginBottom: 40 },
  cancelButton: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 40 },
  cancelText: { color: '#DC2626', fontSize: 18, fontWeight: 'bold' },
});