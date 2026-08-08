import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as SecureStore from 'expo-secure-store';

type Props = NativeStackScreenProps<RootStackParamList, 'SosConfirmation'>;

export default function SosConfirmationScreen({ route, navigation }: Props) {
  const { channel, contactsNotified, lanBroadcastSent, meshBroadcastSent, error } = route.params;

  useEffect(() => {
    if (channel !== 'failed') {
      const timer = setTimeout(() => {
        SecureStore.getItemAsync('obhoy_auto_record_sos').then((val) => {
          if (val === 'true') {
            navigation.navigate('EvidenceCapture', { autoStart: true });
          }
        });
      }, 2000); // 2 second delay so user sees SOS confirmation first

      return () => clearTimeout(timer);
    }
  }, [channel, navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{channel === 'failed' ? 'SOS could not be sent' : 'SOS Sent'}</Text>
      <Text style={styles.subtitle}>
        {channel === 'backend' && 'Sent via internet.'}
        {channel === 'native' && 'Sent directly by SMS (no internet available).'}
        {channel === 'lan' && (lanBroadcastSent
          ? "Couldn't reach your contacts by SMS. Broadcast to nearby Obhoy users instead — delivery can't be confirmed, this only reaches someone with the app open close by."
          : "Couldn't reach your contacts by SMS, and no local network was available either. Try the Emergency Directory to call for help directly.")}
        {channel === 'mesh' && (meshBroadcastSent
          ? "Couldn't reach your contacts by SMS or local WiFi. Relayed through nearby Obhoy devices instead — delivery can't be confirmed, this only reaches someone with the app open close by."
          : "Couldn't reach your contacts, and no nearby Obhoy devices were connected to relay through. Try the Emergency Directory to call for help directly.")}
        {channel === 'failed' && (error || 'Please try again.')}
      </Text>
      <FlatList
        data={contactsNotified || []}
        keyExtractor={(item, i) => item.phone || String(i)}
        renderItem={({ item }) => (
          <View style={styles.contactRow}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={item.status === 'sent' ? styles.statusOk : styles.statusFail}>
              {item.status === 'sent' ? '✓ Sent' : '✗ Failed'}
            </Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.button} onPress={() => navigation.popToTop()}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#EDE9FE', borderRadius: 8, padding: 14, marginBottom: 8 },
  contactName: { fontSize: 16, color: '#111827' },
  statusOk: { color: '#16A34A', fontWeight: 'bold' },
  statusFail: { color: '#DC2626', fontWeight: 'bold' },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});