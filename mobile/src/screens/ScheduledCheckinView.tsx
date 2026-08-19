import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import { apiRequest } from '../api/client';
import { ScreenHeader, Card, Button, Pill } from '../components';
import { colors, spacing } from '../theme/theme';
import { t, useLanguage } from '../i18n';

type Props = {
  journeyId: string;
  deadline: string;
  navigation: any;
};

export default function ScheduledCheckinView({ journeyId, deadline, navigation }: Props) {
  useLanguage();
  const notificationIdRef = useRef<string | null>(null);
  const deadlineDate = new Date(deadline);

  useEffect(() => {
    const reminderMs = deadlineDate.getTime() - Date.now() - 10 * 60 * 1000; 
    
    if (reminderMs > 0) {
      Notifications.scheduleNotificationAsync({
        content: { title: 'Obhoy', body: "Don't forget to confirm you're safe." },
        trigger: { 
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
  }, [deadline]);

  const handleConfirm = async () => {
    await apiRequest(`/journey/${journeyId}/arrive`, { method: 'PATCH' });
    navigation.popToTop();
  };

  const handleCancel = async () => {
    await apiRequest(`/journey/${journeyId}/cancel`, { method: 'PATCH' });
    navigation.popToTop();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with Mode Pill */}
      <ScreenHeader
        title="Scheduled Check-in"
        subtitle="One-time deadline safety confirmation"
        right={<Pill label="🟣 Deadline" tone="neutral" />}
      />

      {/* Deadline Card */}
      <Card style={styles.deadlineCard}>
        <Text style={styles.cardHeaderLabel}>CONFIRM SAFETY BEFORE</Text>
        <Text style={styles.deadlineTime}>
          {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={styles.cardSubtitle}>
          Contacts alerted automatically if you do not confirm by this time.
        </Text>
      </Card>

      {/* Centered Circular "I'm Safe" Button */}
      <View style={styles.heroWrap}>
        <Pressable
          style={({ pressed }) => [styles.safeCircleBtn, pressed && styles.safeCirclePressed]}
          onPress={handleConfirm}
        >
          <Feather name="shield" size={38} color="#FFFFFF" style={{ marginBottom: 4 }} />
          <Text style={styles.safeBtnText}>I'm Safe</Text>
        </Pressable>
        <Text style={styles.powerNote}>
          🔋 Low-power mode: GPS tracking is paused to conserve battery until the deadline.
        </Text>
      </View>

      <View style={styles.footerWrap}>
        <Button
          label={t('common.cancel') || 'Cancel Check-in'}
          variant="outline"
          onPress={handleCancel}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  deadlineCard: { alignItems: 'center', paddingVertical: spacing.xl, marginBottom: spacing.xl },
  cardHeaderLabel: { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 1, marginBottom: spacing.xs },
  deadlineTime: { fontSize: 36, fontWeight: '900', color: colors.primary, marginVertical: spacing.xs },
  cardSubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.md },
  heroWrap: { alignItems: 'center', marginVertical: spacing.md, flex: 1, justifyContent: 'center' },
  safeCircleBtn: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.safe,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.safe,
    shadowOpacity: 0.35,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
  },
  safeCirclePressed: { transform: [{ scale: 0.96 }], opacity: 0.9 },
  safeBtnText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  powerNote: { fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg, lineHeight: 18 },
  footerWrap: { marginTop: 'auto', paddingTop: spacing.md },
});