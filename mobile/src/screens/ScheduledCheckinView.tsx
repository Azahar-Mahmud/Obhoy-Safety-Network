import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import { apiRequest } from '../api/client';

type Props = {
  journeyId: string;
  deadline: string;
  navigation: any;
};

export default function ScheduledCheckinView({ journeyId, deadline, navigation }: Props) {
  const notificationIdRef = useRef<string | null>(null);
  const deadlineDate = new Date(deadline);

  useEffect(() => {
    const reminderMs = deadlineDate.getTime() - Date.now() - 10 * 60 * 1000; 
    
    if (reminderMs > 0) {
      Notifications.scheduleNotificationAsync({
        content: { title: 'Obhoy', body: "Don't forget to confirm you're safe." },
        trigger: { 
          // FIX: Explicitly tell Expo this is a TIME_INTERVAL trigger
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, 
          seconds: Math.floor(reminderMs / 1000) 
        },
      }).then((id) => {
        notificationIdRef.current = id;
      });
    }
    
    return () => {
      if (notificationIdRef.current) {
        Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
      }
    };
  }, [deadline]); // Safe dependency array

  const handleConfirm = async () => {
    await apiRequest(`/journey/${journeyId}/arrive`, { method: 'PATCH' });
    navigation.popToTop();
  };

  const handleCancel = async () => {
    await apiRequest(`/journey/${journeyId}/cancel`, { method: 'PATCH' });
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scheduled Check-in</Text>
      <Text style={styles.subtitle}>
        Contacts alerted if not confirmed by {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      <TouchableOpacity style={styles.safeButton} onPress={handleConfirm}>
        <Text style={styles.safeText}>I'm Safe</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#6B21A8', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 32, textAlign: 'center' },
  safeButton: { backgroundColor: '#16A34A', borderRadius: 80, width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  safeText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { padding: 12 },
  cancelText: { color: '#DC2626', fontSize: 15 },
});