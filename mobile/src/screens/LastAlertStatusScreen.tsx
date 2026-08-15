import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getLastAlertStatus, LastAlertStatus } from '../utils/lastAlertStatus';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'LastAlertStatus'>;

export default function LastAlertStatusScreen({ navigation }: Props) {
  useLanguage();
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

  const getChannelLabel = (channel: string) => {
    if (channel === 'backend') return t('sos.channel_backend');
    if (channel === 'native') return t('sos.channel_native');
    if (channel === 'lan') return t('sos.channel_lan');
    if (channel === 'mesh') return t('sos.channel_mesh');
    return t('sos.channel_failed');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('sos.last_alert_title')}</Text>
      {!checked ? null : !status ? (
        <Text style={styles.subtitle}>{t('sos.last_alert_none')}</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Status</Text>
          <Text style={styles.value}>{getChannelLabel(status.channel)}</Text>
          <Text style={styles.label}>{t('home.contacts')}</Text>
          <Text style={styles.value}>{status.contactsNotifiedCount}</Text>
          <Text style={styles.label}>{t('sos.last_alert_at', { time: '' })}</Text>
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
        <Text style={styles.buttonText}>{t('common.back')}</Text>
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
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 'auto' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});