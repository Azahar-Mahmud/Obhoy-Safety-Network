import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Vibration, BackHandler, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { triggerSos } from '../utils/sos';
import { apiRequest } from '../api/client';
import { showOverLockScreen, hideOverLockScreen } from '../../modules/lock-screen-display/src';
import { t, useLanguage } from '../i18n';
import { Button } from '../components';
import { colors, spacing } from '../theme/theme';

const COUNTDOWN_SECONDS = 30; // 30-second emergency response window

type Props = { 
  onResolved: () => void; 
  onEscalate: () => void; 
};

export default function FallDetectedScreen({ onResolved, onEscalate }: Props) {
  useLanguage();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [escalating, setEscalating] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    showOverLockScreen();
    const pattern = [0, 500, 500];
    Vibration.vibrate(pattern, true);

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1 && !firedRef.current) {
          firedRef.current = true;
          clearInterval(interval);
          escalate();
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      Vibration.cancel();
      backHandler.remove();
      hideOverLockScreen(); 
    };
  }, []);

  const escalate = async () => {
    setEscalating(true);
    try {
      const contacts = await apiRequest('/contacts');
      await triggerSos(contacts);
    } catch {}
    Vibration.cancel();
    onEscalate();
  };

  const handleImOkay = () => {
    Vibration.cancel();
    onResolved();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. Pulsing Siren Warning Icon */}
        <View style={styles.sirenOuter}>
          <View style={styles.sirenInner}>
            <Feather name="zap" size={36} color="#FFFFFF" />
          </View>
        </View>

        {/* 2. High-Urgency Titles */}
        <Text style={styles.title}>{t('fall.title') || 'Fall Detected!'}</Text>
        <Text style={styles.subtitle}>
          Are you okay? A sudden impact was detected.
        </Text>

        {/* 3. Prominent Countdown Timer */}
        <Text style={styles.timer}>{secondsLeft}s</Text>
        <Text style={styles.hint}>
          {t('fall.countdown', { seconds: secondsLeft }) || `Alerting emergency contacts automatically in ${secondsLeft} seconds`}
        </Text>

        {/* 4. Action Buttons */}
        <View style={styles.buttonGroup}>
          <Button
            label={`✓ ${t('fall.im_okay') || "I'm OK — Cancel Alert"}`}
            variant="safe"
            onPress={handleImOkay}
            style={styles.okButton}
          />

          <Button
            label={escalating ? 'Sending Alert...' : 'Send Emergency SOS Now'}
            variant="danger"
            onPress={escalate}
            disabled={escalating}
            style={styles.sosButton}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0C16' },
  content: { 
    flexGrow: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: spacing.xl,
    paddingVertical: 40 
  },
  sirenOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(217, 119, 6, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  sirenInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.caution,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
  },
  title: { fontSize: 30, fontWeight: '900', color: colors.caution, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#D1D5DB', textAlign: 'center', marginBottom: spacing.lg, lineHeight: 22 },
  timer: { fontSize: 64, fontWeight: '900', color: '#FFFFFF', letterSpacing: -1, marginBottom: 4 },
  hint: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 40, lineHeight: 20 },
  buttonGroup: { width: '100%', gap: 14, marginTop: 'auto' },
  okButton: { minHeight: 60 },
  sosButton: { minHeight: 52 },
});