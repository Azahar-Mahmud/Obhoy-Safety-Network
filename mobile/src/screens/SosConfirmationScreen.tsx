import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as SecureStore from 'expo-secure-store';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'SosConfirmation'>;

export default function SosConfirmationScreen({ route, navigation }: Props) {
  useLanguage();
  const { channel, contactsNotified, error } = route.params;

  useEffect(() => {
    if (channel !== 'failed') {
      const timer = setTimeout(() => {
        SecureStore.getItemAsync('obhoy_auto_record_sos').then((val) => {
          if (val === 'true') {
            navigation.navigate('EvidenceCapture', { autoStart: true });
          }
        });
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [channel, navigation]);

  const getSubtitle = () => {
    if (channel === 'backend') return t('sos.channel_backend');
    if (channel === 'native') return t('sos.channel_native');
    if (channel === 'lan') return t('sos.channel_lan');
    if (channel === 'mesh') return t('sos.channel_mesh');
    return error || t('sos.channel_failed');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{channel === 'failed' ? t('sos.channel_failed') : t('sos.sent_title')}</Text>
      <Text style={styles.subtitle}>{getSubtitle()}</Text>
      <FlatList
        data={contactsNotified || []}
        keyExtractor={(item, i) => item.phone || String(i)}
        renderItem={({ item }) => (
          <View style={styles.contactRow}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={item.status === 'sent' ? styles.statusOk : styles.statusFail}>
              {item.status === 'sent' ? '✓ ' + t('common.done') : '✗ ' + t('sos.channel_failed')}
            </Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.button} onPress={() => navigation.popToTop()}>
        <Text style={styles.buttonText}>{t('common.done')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24, lineHeight: 20 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#EDE9FE', borderRadius: 8, padding: 14, marginBottom: 8, minHeight: 48, alignItems: 'center' },
  contactName: { fontSize: 16, color: '#111827' },
  statusOk: { color: '#16A34A', fontWeight: 'bold' },
  statusFail: { color: '#DC2626', fontWeight: 'bold' },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});