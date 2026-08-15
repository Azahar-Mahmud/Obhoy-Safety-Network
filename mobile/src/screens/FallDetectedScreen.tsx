import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, BackHandler } from 'react-native';
import { triggerSos } from '../utils/sos';
import { apiRequest } from '../api/client';
import { showOverLockScreen, hideOverLockScreen } from '../../modules/lock-screen-display/src';
import { t, useLanguage } from '../i18n';

const COUNTDOWN_SECONDS = 5 * 60; 

type Props = { 
  onResolved: () => void; 
  onEscalate: () => void; 
};

export default function FallDetectedScreen({ onResolved, onEscalate }: Props) {
  useLanguage();
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
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

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('fall.title')}</Text>
      <Text style={styles.subtitle}>{t('fall.title')}</Text>
      
      <Text style={styles.timer}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </Text>
      
      <Text style={styles.hint}>
        {t('fall.countdown', { seconds: secondsLeft })}
      </Text>
      
      <TouchableOpacity style={styles.okButton} onPress={handleImOkay}>
        <Text style={styles.okText}>{t('fall.im_okay')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#DC2626', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#fff', marginBottom: 24, textAlign: 'center' },
  timer: { fontSize: 56, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  hint: { fontSize: 14, color: '#fff', textAlign: 'center', marginBottom: 40, opacity: 0.9 },
  okButton: { backgroundColor: '#fff', borderRadius: 40, paddingVertical: 20, paddingHorizontal: 48, minHeight: 64, justifyContent: 'center' },
  okText: { color: '#DC2626', fontSize: 20, fontWeight: 'bold' },
});