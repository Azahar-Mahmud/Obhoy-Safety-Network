import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration, BackHandler } from 'react-native';
import { triggerSos } from '../utils/sos';
import { apiRequest } from '../api/client';
import { showOverLockScreen, hideOverLockScreen } from '../../modules/lock-screen-display/src';
// 5 minutes — giving the user plenty of time to cancel if it was a false alarm.
// (You might want to temporarily change this to 10 seconds later when we test it!)
const COUNTDOWN_SECONDS = 5 * 60; 

type Props = { 
  onResolved: () => void; 
  onEscalate: () => void; 
};

export default function FallDetectedScreen({ onResolved, onEscalate }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const firedRef = useRef(false);

  useEffect(() => {
    // 1. Force the red screen to turn on the display and show over the lock screen!
    showOverLockScreen();

    // Vibrate pattern: 0ms wait, vibrate 500ms, pause 500ms (repeats)
    const pattern = [0, 500, 500];
    Vibration.vibrate(pattern, true); // true = repeat until cancelled

    // Prevent accidental hardware back-button presses
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
      // 2. Hide the lock screen override if they click "I'm Okay" or timer expires
      hideOverLockScreen(); 
    };
  }, []);

  const escalate = async () => {
    try {
      const contacts = await apiRequest('/contacts');
      await triggerSos(contacts);
    } catch {
      // Even if the network fails or SOS fails, the medical card below still needs to show.
    }
    Vibration.cancel();
    onEscalate(); // This triggers the Medical Card context
  };

  const handleImOkay = () => {
    Vibration.cancel();
    onResolved(); // Dismisses the screen and goes back to whatever the user was doing
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Are you okay?</Text>
      <Text style={styles.subtitle}>A sudden impact was detected.</Text>
      
      <Text style={styles.timer}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </Text>
      
      <Text style={styles.hint}>
        If there's no response, your contacts will be alerted automatically.
      </Text>
      
      <TouchableOpacity style={styles.okButton} onPress={handleImOkay}>
        <Text style={styles.okText}>I'm Okay</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#DC2626', // A loud, aggressive red to grab attention
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#fff', marginBottom: 24 },
  timer: { fontSize: 56, fontWeight: 'bold', color: '#fff', marginBottom: 24 },
  hint: { fontSize: 14, color: '#fff', textAlign: 'center', marginBottom: 40, opacity: 0.9 },
  okButton: { backgroundColor: '#fff', borderRadius: 40, paddingVertical: 20, paddingHorizontal: 48 },
  okText: { color: '#DC2626', fontSize: 20, fontWeight: 'bold' },
});