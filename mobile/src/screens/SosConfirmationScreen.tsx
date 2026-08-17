import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Linking } from 'react-native';
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

  // Honest, specific channel descriptions
  const getChannelDescription = () => {
    const successfulContacts = (contactsNotified || []).filter((c) => c.status === 'sent').map((c) => c.name).join(', ');
    
    if (channel === 'backend') {
      return successfulContacts 
        ? `Alert delivered to ${successfulContacts} via Internet & SMS Gateway.`
        : t('sos.channel_backend');
    }
    if (channel === 'native') {
      return successfulContacts
        ? `Alert delivered to ${successfulContacts} via Direct Cellular SMS.`
        : t('sos.channel_native');
    }
    if (channel === 'lan') {
      return 'No cellular service. Alert broadcast to nearby devices on local Wi-Fi.';
    }
    if (channel === 'mesh') {
      return 'No network available. Alert relayed to nearby devices via Bluetooth Mesh.';
    }
    return error || 'Could not reach emergency contacts. Please call emergency services directly.';
  };

  const handleCall999 = () => {
    Linking.openURL('tel:999').catch(() => {});
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, channel === 'failed' && styles.titleFail]}>
        {channel === 'failed' ? t('sos.channel_failed') : t('sos.sent_title')}
      </Text>
      
      <Text style={styles.subtitle}>{getChannelDescription()}</Text>

      {/* Always-visible direct emergency call button */}
      <TouchableOpacity style={styles.emergencyCallButton} onPress={handleCall999}>
        <Text style={styles.emergencyCallText}>📞 Call 999 (National Emergency)</Text>
      </TouchableOpacity>

      <Text style={styles.sectionHeader}>{t('home.contacts')}</Text>
      
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#16A34A', marginTop: 20, marginBottom: 8 },
  titleFail: { color: '#DC2626' },
  subtitle: { fontSize: 14, color: '#374151', marginBottom: 16, lineHeight: 20 },
  emergencyCallButton: { backgroundColor: '#DC2626', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 20 },
  emergencyCallText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  sectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#EDE9FE', borderRadius: 8, padding: 14, marginBottom: 8, minHeight: 48, alignItems: 'center' },
  contactName: { fontSize: 16, color: '#111827' },
  statusOk: { color: '#16A34A', fontWeight: 'bold' },
  statusFail: { color: '#DC2626', fontWeight: 'bold' },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});