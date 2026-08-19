import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { triggerSos } from '../utils/sos';
import { t, useLanguage } from '../i18n';
import { Button } from '../components';
import { colors, radii, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SosCountdown'>;
const COUNTDOWN_SECONDS = 3; // Reduced to 3s to match HTML mockup

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
      if (cached) { try { contacts = JSON.parse(cached); } catch { contacts = []; } }
    }

    try {
      const result = await triggerSos(contacts);
      navigation.replace('SosConfirmation', result);
    } catch (err: any) {
      navigation.replace('SosConfirmation', {
        channel: 'failed', contactsNotified: [],
        error: err.message || t('sos.channel_failed'),
      });
    }
  }, [navigation]);

  useEffect(() => {
    if (secondsLeft <= 0) { fireSos(); return; }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, fireSos]);

  return (
    <View style={styles.backdrop}>
      <View style={styles.sheet}>
        {sending ? (
          <View style={{ alignItems: 'center', marginVertical: 40 }}>
            <Text style={styles.title}>Sending your alert…</Text>
            <Text style={styles.hint}>Trying every channel until one gets through</Text>
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.redTitle}>SENDING SOS</Text>
            <Text style={styles.countdown}>{secondsLeft}</Text>
            <Text style={styles.hint}>Alert goes out when this reaches zero</Text>
            <View style={{ height: 40 }} />
            <Button label="Cancel" variant="outline" onPress={() => navigation.goBack()} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 30, elevation: 16 },
  redTitle: { fontSize: 16, fontWeight: '800', color: colors.danger, marginTop: 10 },
  countdown: { fontSize: 96, fontWeight: '900', color: colors.danger, lineHeight: 100, marginVertical: 20 },
  hint: { fontSize: 14, color: colors.text2, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
});