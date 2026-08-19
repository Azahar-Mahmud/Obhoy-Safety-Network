import React from 'react';
import { View, Text, FlatList, StyleSheet, Linking } from 'react-native';
import { useLanAlerts } from '../context/LanAlertContext';
import { useMesh } from '../context/MeshContext';
import { ScreenHeader, Card, Button, Pill, EmptyState } from '../components';
import { colors, spacing } from '../theme/theme';
import { t, useLanguage } from '../i18n';

export default function NearbyAlertsScreen() {
  useLanguage();
  const { alerts: lanAlerts } = useLanAlerts();
  const { meshAlerts } = useMesh();

  // Combine LAN (WiFi) and Mesh (Bluetooth) alerts, sorted by newest first
  const alerts: any[] = [...lanAlerts, ...meshAlerts].sort(
    (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item: any, i) => String(item.id || item.sentAt || i)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <ScreenHeader
              title={t('home.nearby_alerts') || 'Nearby Alerts'}
              subtitle="Local Wi-Fi and Bluetooth Mesh broadcasts received from nearby users."
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No nearby alerts right now"
            subtitle="Security warnings and community check-ins broadcasted within your physical vicinity will appear here."
          />
        }
        renderItem={({ item }: { item: any }) => {
          const isSafeCheckin = item.message?.includes('safe');
          return (
            <Card style={styles.alertCard}>
              <View style={styles.cardHeaderRow}>
                <Pill
                  label={isSafeCheckin ? 'Safe Check-in' : 'Security Alert'}
                  tone={isSafeCheckin ? 'safe' : 'caution'}
                />
                <Text style={styles.timeText}>
                  {item.receivedAt ? new Date(item.receivedAt).toLocaleTimeString() : 'Just now'}
                </Text>
              </View>

              <Text style={styles.messageText}>{item.message}</Text>

              {item.lat && item.lng ? (
                <Button
                  label="View Location on Map"
                  variant="outline"
                  onPress={() => Linking.openURL(`https://www.google.com/maps?q=${item.lat},${item.lng}`)}
                  style={styles.mapBtn}
                />
              ) : null}
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerWrap: { marginBottom: spacing.sm },
  alertCard: { padding: spacing.lg, marginBottom: spacing.md },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  messageText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  mapBtn: { paddingVertical: 8, minHeight: 40 },
});