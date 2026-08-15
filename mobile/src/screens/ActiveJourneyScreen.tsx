import { useDiscreetMode } from '../context/DiscreetModeContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Vibration, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { checkRouteDanger, NearbyReport } from '../utils/routeDangerCheck';
import ScheduledCheckinView from './ScheduledCheckinView';
import { t, useLanguage } from '../i18n';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveJourney'>;
const LOCATION_UPDATE_MS = 60000;

export default function ActiveJourneyScreen({ route, navigation }: Props) {
  useLanguage();
  const { journeyId, checkinIntervalMinutes, mode, scheduledDeadline } = route.params;

  if (mode === 'scheduled') {
    return <ScheduledCheckinView journeyId={journeyId} deadline={scheduledDeadline!} navigation={navigation} />;
  }

  const { discreetModeEnabled } = useDiscreetMode();
  
  const [lastCheckin, setLastCheckin] = useState(new Date());
  const [insideGeofence, setInsideGeofence] = useState<boolean | null>(null);
  
  const [dangerWarning, setDangerWarning] = useState<NearbyReport[] | null>(null);
  const lastWarnedRef = useRef<number>(0);
  const WARNING_COOLDOWN_MS = 10 * 60 * 1000;

  const [checkinRequested, setCheckinRequested] = useState(false);

  const notificationIdRef = useRef<string | null>(null);

  const scheduleReminder = useCallback(async (minutes: number) => {
    await Notifications.requestPermissionsAsync();
    if (notificationIdRef.current) {
      await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
    }

    const content = {
      title: discreetModeEnabled ? t('notif.checkin_title_discreet') : t('notif.checkin_title'),
      body: discreetModeEnabled ? t('notif.checkin_body_discreet') : t('notif.checkin_body'),
    };

    notificationIdRef.current = await Notifications.scheduleNotificationAsync({
      content,
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: minutes * 60,
        channelId: discreetModeEnabled ? 'checkin-discreet' : 'checkin-default',
      },
    });
  }, [discreetModeEnabled]);

  useEffect(() => {
    scheduleReminder(checkinIntervalMinutes);
    const locInterval = setInterval(async () => {
      try {
        const { coords } = await Location.getCurrentPositionAsync({});
        
        const result = await apiRequest(`/journey/${journeyId}/location`, {
          method: 'PATCH',
          body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
        });
        setInsideGeofence(result.insideGeofence);
        setCheckinRequested(!!result.pendingCheckinRequest);

        const now = Date.now();
        if (now - lastWarnedRef.current > WARNING_COOLDOWN_MS) {
          const { shouldWarn, reports } = await checkRouteDanger(coords.latitude, coords.longitude);
          if (shouldWarn) {
            lastWarnedRef.current = now;
            Vibration.vibrate([0, 300, 200, 300]);
            setDangerWarning(reports);
          }
        }
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
    Alert.alert(t('journey.im_safe'), t('msg.safe_checkin'));
  };

  const handleArrive = async () => {
    await apiRequest(`/journey/${journeyId}/arrive`, { method: 'PATCH' });
    navigation.popToTop();
  };

  const handleCancel = async () => {
    await apiRequest(`/journey/${journeyId}/cancel`, { method: 'PATCH' });
    navigation.popToTop();
  };

  const respondToCheckin = async (response: 'safe' | 'help') => {
    await apiRequest(`/journey/${journeyId}/checkin-response`, {
      method: 'PATCH',
      body: JSON.stringify({ response }),
    });
    setCheckinRequested(false);
    if (response === 'safe') {
      setLastCheckin(new Date());
    }
  };

  return (
    <View style={styles.container}>
      {insideGeofence === false && (
        <View style={styles.geofenceBanner}>
          <Text style={styles.geofenceBannerText}>{t('journey.geofence_warning')}</Text>
        </View>
      )}
      
      <Text style={styles.title}>{t('home.journey')}</Text>
      <Text style={styles.subtitle}>{t('sos.last_alert_at', { time: lastCheckin.toLocaleTimeString() })}</Text>
      
      <TouchableOpacity style={styles.safeButton} onPress={handleArrive}>
        <Text style={styles.safeText}>{t('journey.arrived')}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.checkinButton} onPress={handleCheckin}>
        <Text style={styles.buttonText}>{t('journey.im_safe')}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
        <Text style={styles.cancelText}>{t('common.cancel')}</Text>
      </TouchableOpacity>

      {/* Two-Way Check-in Modal */}
      <Modal visible={checkinRequested} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('journey.checkin_prompt')}</Text>
            <Text style={styles.modalBody}>{t('journey.checkin_prompt')}</Text>
            <TouchableOpacity style={styles.safeResponseButton} onPress={() => respondToCheckin('safe')}>
              <Text style={styles.responseButtonText}>{t('journey.im_safe')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpResponseButton} onPress={() => respondToCheckin('help')}>
              <Text style={styles.responseButtonText}>{t('journey.need_help')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Danger Warning Modal */}
      <Modal visible={!!dangerWarning && !checkinRequested} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('journey.danger_title')}</Text>
            <Text style={styles.modalBody}>{t('journey.danger_body')}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setDangerWarning(null);
                (navigation as any).navigate('Map'); 
              }}
            >
              <Text style={styles.modalButtonText}>{t('journey.view_on_map')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalDismiss} onPress={() => setDangerWarning(null)}>
              <Text style={styles.modalDismissText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  geofenceBanner: { backgroundColor: '#FEE2E2', padding: 12, borderRadius: 8, marginBottom: 24, width: '100%' },
  geofenceBannerText: { color: '#991B1B', fontSize: 14, textAlign: 'center', fontWeight: 'bold' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#D97706', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 32 },
  safeButton: { backgroundColor: '#16A34A', borderRadius: 80, width: 160, height: 160, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  safeText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 12 },
  checkinButton: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center', width: '100%', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { padding: 12 },
  cancelText: { color: '#DC2626', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '100%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#92400E', marginBottom: 8 },
  modalBody: { fontSize: 14, color: '#111827', marginBottom: 16 },
  modalButton: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  modalButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  modalDismiss: { alignItems: 'center', padding: 8 },
  modalDismissText: { color: '#6B7280', fontSize: 14 },
  safeResponseButton: { backgroundColor: '#16A34A', borderRadius: 8, padding: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  helpResponseButton: { backgroundColor: '#DC2626', borderRadius: 8, padding: 14, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  responseButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});