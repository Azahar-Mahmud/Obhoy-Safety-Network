import { useDiscreetMode } from '../context/DiscreetModeContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Vibration, Modal, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { checkRouteDanger, NearbyReport } from '../utils/routeDangerCheck';
import ScheduledCheckinView from './ScheduledCheckinView';
import { t, useLanguage } from '../i18n';
import { publishKnownLocation } from '../utils/familyLocation'; 
import { colors, radii, spacing, typography } from '../theme/theme';
import { Button, Pill } from '../components';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }) });

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveJourney'>;
const LOCATION_UPDATE_MS = 60000;

export default function ActiveJourneyScreen({ route, navigation }: Props) {
  useLanguage();
  const { journeyId, checkinIntervalMinutes, mode, scheduledDeadline } = route.params;

  if (mode === 'scheduled') return <ScheduledCheckinView journeyId={journeyId} deadline={scheduledDeadline!} navigation={navigation} />;

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
    if (notificationIdRef.current) await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
    notificationIdRef.current = await Notifications.scheduleNotificationAsync({
      content: {
        title: discreetModeEnabled ? t('notif.checkin_title_discreet') : t('notif.checkin_title'),
        body: discreetModeEnabled ? t('notif.checkin_body_discreet') : t('notif.checkin_body'),
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: minutes * 60, channelId: discreetModeEnabled ? 'checkin-discreet' : 'checkin-default' },
    });
  }, [discreetModeEnabled]);

  useEffect(() => {
    scheduleReminder(checkinIntervalMinutes);
    const locInterval = setInterval(async () => {
      try {
        const { coords } = await Location.getCurrentPositionAsync({});
        const result = await apiRequest(`/journey/${journeyId}/location`, {
          method: 'PATCH', body: JSON.stringify({ lat: coords.latitude, lng: coords.longitude, accuracy: coords.accuracy }),
        });
        setInsideGeofence(result.insideGeofence); setCheckinRequested(!!result.pendingCheckinRequest);
        publishKnownLocation(coords.latitude, coords.longitude, coords.accuracy);

        const now = Date.now();
        if (now - lastWarnedRef.current > WARNING_COOLDOWN_MS) {
          const { shouldWarn, reports } = await checkRouteDanger(coords.latitude, coords.longitude);
          if (shouldWarn) { lastWarnedRef.current = now; Vibration.vibrate([0, 300, 200, 300]); setDangerWarning(reports); }
        }
      } catch {}
    }, LOCATION_UPDATE_MS);
    
    return () => { clearInterval(locInterval); if (notificationIdRef.current) Notifications.cancelScheduledNotificationAsync(notificationIdRef.current); };
  }, [journeyId, checkinIntervalMinutes, scheduleReminder]);

  const handleCheckin = async () => {
    await apiRequest(`/journey/${journeyId}/checkin`, { method: 'PATCH' });
    setLastCheckin(new Date()); scheduleReminder(checkinIntervalMinutes);
    Alert.alert(t('journey.im_safe'), t('msg.safe_checkin'));
  };

  const handleArrive = async () => { await apiRequest(`/journey/${journeyId}/arrive`, { method: 'PATCH' }); navigation.popToTop(); };
  const handleCancel = async () => { await apiRequest(`/journey/${journeyId}/cancel`, { method: 'PATCH' }); navigation.popToTop(); };

  const respondToCheckin = async (response: 'safe' | 'help') => {
    await apiRequest(`/journey/${journeyId}/checkin-response`, { method: 'PATCH', body: JSON.stringify({ response }) });
    setCheckinRequested(false); if (response === 'safe') setLastCheckin(new Date());
  };

  return (
    <View style={styles.container}>
      
      {/* Top Graphic Area (Mock Map Route) */}
      <View style={styles.mapFake}>
        <View style={styles.routeLine}><View style={styles.routeDot} /></View>
      </View>

      {/* Bottom Sheet Area */}
      <View style={styles.bottomSheet}>
        {insideGeofence === false && (
          <View style={styles.geofenceBanner}>
            <Text style={styles.geofenceBannerText}>{t('journey.geofence_warning')}</Text>
          </View>
        )}
        
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.hint}>Journey Active</Text>
            <Text style={styles.title}>En Route to Destination</Text>
          </View>
          <Pill label="● Active" tone="caution" />
        </View>

        <View style={styles.timerBox}>
          <Text style={styles.hint}>Last Check-in</Text>
          <Text style={styles.timerText}>{lastCheckin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          <Text style={styles.hint}>Next check-in in {checkinIntervalMinutes}m</Text>
        </View>
        
        <View style={styles.buttonRow}>
          <Button label="I Arrived" variant="safe" style={{ flex: 1 }} onPress={handleArrive} />
          <Button label="HELP" variant="danger" style={{ flex: 1 }} onPress={() => navigation.navigate('SosCountdown')} />
        </View>

        <Button label="I'm Fine (Check In)" variant="outline" onPress={handleCheckin} style={{ marginBottom: 12 }} />
        <TouchableOpacity style={{ padding: 12, alignItems: 'center' }} onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel Journey</Text>
        </TouchableOpacity>
      </View>

      {/* Two-Way Check-in Modal */}
      <Modal visible={checkinRequested} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('journey.checkin_prompt')}</Text>
            <Text style={styles.modalBody}>{t('journey.checkin_prompt')}</Text>
            <Button label={t('journey.im_safe')} variant="safe" style={{ marginBottom: 10 }} onPress={() => respondToCheckin('safe')} />
            <Button label={t('journey.need_help')} variant="danger" onPress={() => respondToCheckin('help')} />
          </View>
        </View>
      </Modal>

      {/* Danger Warning Modal */}
      <Modal visible={!!dangerWarning && !checkinRequested} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('journey.danger_title')}</Text>
            <Text style={styles.modalBody}>{t('journey.danger_body')}</Text>
            <Button label={t('journey.view_on_map')} variant="primary" style={{ marginBottom: 10 }} onPress={() => { setDangerWarning(null); (navigation as any).navigate('Map'); }} />
            <TouchableOpacity style={{ padding: 12 }} onPress={() => setDangerWarning(null)}>
              <Text style={{ color: colors.text2, textAlign: 'center', fontWeight: 'bold' }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  mapFake: { flex: 1, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  routeLine: { width: 120, height: 4, backgroundColor: colors.border, borderRadius: 2, position: 'relative' },
  routeDot: { width: 16, height: 16, backgroundColor: colors.primary, borderRadius: 8, position: 'absolute', top: -6 },
  
  bottomSheet: {
    backgroundColor: colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 34, elevation: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 15, shadowOffset: { width: 0, height: -4 },
  },
  
  geofenceBanner: { backgroundColor: colors.dangerTint, padding: 12, borderRadius: 8, marginBottom: 16 },
  geofenceBannerText: { color: colors.danger, fontSize: 14, textAlign: 'center', fontWeight: 'bold' },
  
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  hint: { fontSize: 13, color: colors.text2 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 2 },
  
  timerBox: { alignItems: 'center', marginBottom: 24 },
  timerText: { fontSize: 36, fontWeight: '300', color: colors.text, letterSpacing: 2, marginVertical: 4 },
  
  buttonRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  cancelText: { color: colors.text2, fontSize: 15, fontWeight: '700' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.cardBg, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8 },
  modalBody: { fontSize: 15, color: colors.text2, marginBottom: 24 },
});