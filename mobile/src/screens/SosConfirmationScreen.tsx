import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import * as SecureStore from 'expo-secure-store';
import { t, useLanguage } from '../i18n';
import { EvidenceCaptureModal, Button } from '../components';
import { colors, spacing, radii } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SosConfirmation'>;

export default function SosConfirmationScreen({ route, navigation }: Props) {
  useLanguage();
  const { channel, contactsNotified, error } = route.params;
  const [showEvidenceCapture, setShowEvidenceCapture] = useState(false);

  useEffect(() => {
    if (channel !== 'failed') {
      const timer = setTimeout(() => {
        SecureStore.getItemAsync('obhoy_auto_record_sos').then((val) => {
          if (val === 'true') { navigation.navigate('EvidenceCapture', { autoStart: true }); }
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [channel, navigation]);

  const getChannelDescription = () => {
    if (channel === 'backend') return 'Sent via Internet & SMS Gateway';
    if (channel === 'native') return 'Sent via Direct Cellular SMS';
    if (channel === 'lan') return 'Sent via Local Wi-Fi Broadcast';
    if (channel === 'mesh') return 'Relayed via Bluetooth Mesh';
    return error || 'Could not reach emergency contacts.';
  };

  return (
    <View style={styles.backdrop}>
      <View style={styles.sheet}>
        
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View style={styles.confirmCheck}>
            <Feather name="check" size={40} color={colors.safe} />
          </View>
          <Text style={[styles.title, channel === 'failed' && { color: colors.danger }]}>
            {channel === 'failed' ? t('sos.channel_failed') : 'Alert sent'}
          </Text>
          <Text style={styles.subtitle}>{getChannelDescription()}</Text>
        </View>

        <FlatList
          data={contactsNotified || []}
          keyExtractor={(item, i) => item.phone || String(i)}
          style={{ maxHeight: 180 }}
          renderItem={({ item }) => (
            <View style={styles.contactRow}>
              <View style={styles.row}>
                <View style={styles.avatar}><Text style={{fontWeight:'700', color:colors.primary}}>{item.name[0]?.toUpperCase() || '?'}</Text></View>
                <Text style={styles.contactName}>{item.name}</Text>
              </View>
              <Text style={item.status === 'sent' ? styles.statusOk : styles.statusFail}>
                {item.status === 'sent' ? '✓ Sent' : '✗ Failed'}
              </Text>
            </View>
          )}
        />

        <View style={{ marginTop: 24, gap: 12 }}>
          <Button label="Call 999 now" variant="danger" onPress={() => Linking.openURL('tel:999')} />
          <Button label="Close" variant="outline" onPress={() => navigation.popToTop()} />
        </View>

      </View>

      <EvidenceCaptureModal visible={showEvidenceCapture} onClose={() => setShowEvidenceCapture(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  
  confirmCheck: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.safeTint, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.text, fontWeight: '600' },
  
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  contactName: { fontSize: 15, color: colors.text, fontWeight: '600' },
  
  statusOk: { color: colors.safe, fontWeight: '800', fontSize: 13 },
  statusFail: { color: colors.danger, fontWeight: '800', fontSize: 13 },
});