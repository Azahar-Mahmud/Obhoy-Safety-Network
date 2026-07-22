import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveJourney'>;
const LOCATION_UPDATE_MS = 60000;

export default function ActiveJourneyScreen({ route, navigation }: Props) {
  const { journeyId, checkinIntervalMinutes } = route.params;
  const [lastCheckin, setLastCheckin] = useState(new Date());
  const notificationIdRef = useRef<string | null>(null);

  const scheduleReminder = useCallback(async (minutes: number) => {
    await Notifications.requestPermissionsAsync();
    if (notificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
    }
    notificationIdRef.current = await Notifications.scheduleNotificationAsync({
      content: { title: 'Obhoy Check-in', body: "Open the app to confirm you're okay." },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
      },
    });
  }, []);

  useEffect(() => {
    scheduleReminder(checkinIntervalMinutes);
    const locInterval = setInterval(async () => {
      try {
        const { coords } = await Location.getCurrentPositionAsync({});
        await apiRequest(`/journey/${journeyId}/location`, {
          method: 'PATCH',
          body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
        });
      } catch {}
    }, LOCATION_UPDATE_MS);
    return () => {
      clearInterval(locInterval);
      if (notificationIdRef.current) Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
    };
  }, [journeyId, checkinIntervalMinutes, scheduleReminder]);

  const handleCheckin = async () => {
    await apiRequest(`/journey/${journeyId}/checkin`, { method: 'PATCH' });
    setLastCheckin(new Date());
    scheduleReminder(checkinIntervalMinutes);
    Alert.alert('Checked in', "Great, we'll check again later.");
  };

  const handleArrive = async () => {
    await apiRequest(`/journey/${journeyId}/arrive`, { method: 'PATCH' });
    navigation.popToTop();
  };

  const handleCancel = async () => {
    await apiRequest(`/journey/${journeyId}/cancel`, { method: 'PATCH' });
    navigation.popToTop();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Journey Active</Text>
      <Text style={styles.subtitle}>Last checked in: {lastCheckin.toLocaleTimeString()}</Text>
      <TouchableOpacity style={styles.safeButton} onPress={handleArrive}>
        <Text style={styles.safeText}>I Arrived Safely</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.checkinButton} onPress={handleCheckin}>
        <Text style={styles.buttonText}>I'm OK, Keep Going</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelText}>Cancel Journey</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D97706', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 32 },
  safeButton: { backgroundColor: '#16A34A', borderRadius: 80, width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  safeText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 12 },
  checkinButton: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, alignItems: 'center', width: '100%', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { padding: 12 },
  cancelText: { color: '#DC2626', fontSize: 15 },
});