import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Alert, Vibration, Modal, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { useDiscreetMode } from '../context/DiscreetModeContext';
import { checkRouteDanger, NearbyReport } from '../utils/routeDangerCheck';
import { publishKnownLocation } from '../utils/familyLocation';
import ScheduledCheckinView from './ScheduledCheckinView';
import { t, useLanguage } from '../i18n';

import { colors, radii, spacing, typography } from '../theme/theme';
import { Button, Pill, Card, ScreenHeader } from '../components';

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
    if (notificationIdRef.current) await Notifications.cancelScheduledNotificationAsync(notificationIdRef.current);
    notificationIdRef.current = await Notifications.scheduleNotificationAsync({
      content: {
        title: discreetModeEnabled ? t('notif.checkin_title_discreet') : t('notif.checkin_title'),
        body: discreetModeEnabled ? t('notif.checkin_body_discreet') : t('notif.checkin_body'),
      },
      trigger: { 
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, 
        seconds: minutes * 60, 
        channelId: discreetModeEnabled ? 'checkin-discreet' : 'checkin-default' 
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
        publishKnownLocation(coords.latitude, coords.longitude, coords.accuracy);

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
      body: JSON.stringify({ response }) 
    });
    setCheckinRequested(false); 
    if (response === 'safe') setLastCheckin(new Date());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      {/* Header with Active State Badge */}
      <ScreenHeader
        title={t('home.journey') || 'Active Journey'}
        subtitle="Live GPS tracking & recurring safety check-ins"
        right={<Pill label="Active" tone="caution" />}
      />

      {/* Geofence Warning if outside safe radius */}
      {insideGeofence === false && (
        <View style={styles.geofenceBanner}>
          <Feather name="alert-triangle" size={18} color={colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.geofenceBannerText}>{t('journey.geofence_warning')}</Text>
        </View>
      )}

      {/* Timer Status Card */}
      <Card style={styles.timerCard}>
        <Text style={styles.timerLabel}>LAST CHECK-IN</Text>
        <Text style={styles.timerValue}>
          {lastCheckin.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.timerSub}>
          Automatic check-in prompt every {checkinIntervalMinutes} minutes
        </Text>
      </Card>

      {/* Primary Action Buttons */}
      <View style={styles.actionsCard}>
        <Button
          label={t('journey.arrived') || 'I Arrived Safely'}
          variant="safe"
          onPress={handleArrive}
          style={styles.actionBtn}
        />
        
        <Button
          label={t('journey.im_safe') || "I'm OK (Check In Now)"}
          variant="outline"
          onPress={handleCheckin}
          style={styles.actionBtn}
        />

        <Button
          label={t('journey.need_help') || 'Emergency SOS'}
          variant="danger"
          onPress={() => navigation.navigate('SosCountdown')}
          style={styles.actionBtn}
        />
      </View>

      {/* Cancel Journey Link */}
      <Pressable style={styles.cancelLink} onPress={handleCancel}>
        <Text style={styles.cancelLinkText}>{t('common.cancel') || 'End / Cancel Journey'}</Text>
      </Pressable>

      {/* Two-Way Check-in Modal */}
      <Modal visible={checkinRequested} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('journey.checkin_prompt')}</Text>
            <Text style={styles.modalBody}>A trusted contact is checking on you. Are you safe?</Text>
            <Button 
              label={t('journey.im_safe')} 
              variant="safe" 
              style={{ marginBottom: 10 }} 
              onPress={() => respondToCheckin('safe')} 
            />
            <Button 
              label={t('journey.need_help')} 
              variant="danger" 
              onPress={() => respondToCheckin('help')} 
            />
          </View>
        </View>
      </Modal>

      {/* Danger Warning Modal */}
      <Modal visible={!!dangerWarning && !checkinRequested} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('journey.danger_title')}</Text>
            <Text style={styles.modalBody}>{t('journey.danger_body')}</Text>
            <Button 
              label={t('journey.view_on_map')} 
              variant="primary" 
              style={{ marginBottom: 10 }} 
              onPress={() => { setDangerWarning(null); (navigation as any).navigate('Map'); }} 
            />
            <Pressable style={{ padding: 12 }} onPress={() => setDangerWarning(null)}>
              <Text style={styles.dismissModalText}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  geofenceBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.dangerTint, 
    padding: spacing.md, 
    borderRadius: radii.md, 
    marginBottom: spacing.md 
  },
  geofenceBannerText: { color: colors.danger, fontSize: 13, fontWeight: '700', flex: 1 },
  timerCard: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.lg },
  timerLabel: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, letterSpacing: 1 },
  timerValue: { fontSize: 36, fontWeight: '900', color: colors.textPrimary, marginVertical: spacing.xs },
  timerSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  actionsCard: { gap: spacing.sm, marginBottom: spacing.lg },
  actionBtn: { width: '100%' },
  cancelLink: { alignItems: 'center', padding: spacing.md },
  cancelLinkText: { color: colors.textSecondary, fontWeight: '600', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: radii.lg, padding: spacing.xl, width: '100%', elevation: 8 },
  modalTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  modalBody: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 20 },
  dismissModalText: { color: colors.textSecondary, textAlign: 'center', fontWeight: 'bold' },
});