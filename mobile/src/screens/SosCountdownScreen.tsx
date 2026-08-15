import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { triggerSos } from '../utils/sos';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'SosCountdown'>;
const COUNTDOWN_SECONDS = 5;

export default function SosCountdownScreen({ navigation }: Props) {
  useLanguage();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [sending, setSending] = useState(false);
  const hasFiredRef = useRef(false);

  const fireSos = useCallback(async () => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    setSending(true);

    let contacts = [];
    try {
      contacts = await apiRequest('/contacts');
      await SecureStore.setItemAsync('obhoy_contacts', JSON.stringify(contacts));
    } catch {
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
      const result = await triggerSos(contacts);
      navigation.replace('SosConfirmation', result);
    } catch (err: any) {
      navigation.replace('SosConfirmation', {
        channel: 'failed',
        contactsNotified: [],
        error: err.message || t('sos.channel_failed'),
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
        <Text style={styles.title}>{t('sos.sent_title')}...</Text>
      ) : (
        <>
          <Text style={styles.countdown}>{secondsLeft}</Text>
          <Text style={styles.subtitle}>{t('sos.countdown', { seconds: secondsLeft })}</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#DC2626', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  countdown: { fontSize: 96, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 18, color: '#fff', marginTop: 8, marginBottom: 40, textAlign: 'center' },
  cancelButton: { backgroundColor: '#fff', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 40, minHeight: 48, justifyContent: 'center' },
  cancelText: { color: '#DC2626', fontSize: 18, fontWeight: 'bold' },
});