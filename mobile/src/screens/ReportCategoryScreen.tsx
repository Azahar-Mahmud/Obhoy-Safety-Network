import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

import { ScreenHeader, ListRow, Card } from '../components';
import { colors, spacing, typography, radii } from '../theme/theme';
import { apiRequest } from '../api/client';
import { broadcastSafeCheckin } from '../utils/safetyCheckin';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportCategory'>;

const CATEGORIES = [
  { id: 'harassment', label: 'Harassment', icon: 'frown' as const, color: colors.danger },
  { id: 'mugging', label: 'Mugging / Robbery', icon: 'alert-octagon' as const, color: colors.danger },
  { id: 'checkpost_harassment', label: 'Checkpost Harassment', icon: 'shield-off' as const, color: colors.danger },
  { id: 'poor_lighting', label: 'Poor Lighting', icon: 'moon' as const, color: colors.caution },
  { id: 'safe_spot', label: 'Safe Spot', icon: 'check-circle' as const, color: colors.safe },
];

const UNDO_WINDOW_MS = 6000;

export default function ReportCategoryScreen({ navigation, route }: Props) {
  useLanguage();
  const [reportCoords, setReportCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [toast, setToast] = useState<{ label: string; reportId: string } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (route.params?.lat != null && route.params?.lng != null) {
      setReportCoords({ lat: route.params.lat, lng: route.params.lng });
    } else {
      Location.getLastKnownPositionAsync()
        .then((last) => {
          if (last) setReportCoords({ lat: last.coords.latitude, lng: last.coords.longitude });
        })
        .catch(() => {});
    }
  }, [route.params]);

  const showToast = (label: string, reportId: string) => {
    setToast({ label, reportId });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setToast(null), UNDO_WINDOW_MS);
  };

  const openMapPicker = () => {
    navigation.navigate('MapPointPicker', {
      title: 'Select Report Location',
      initialLat: reportCoords?.lat ?? 23.8103,
      initialLng: reportCoords?.lng ?? 90.4125,
      targetField: 'report',
    });
  };

  const submitReport = async (categoryId: string, categoryLabel: string) => {
    try {
      let lat = reportCoords?.lat;
      let lng = reportCoords?.lng;

      if (lat == null || lng == null) {
        const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lat = fresh.coords.latitude;
        lng = fresh.coords.longitude;
      }

      const result = await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({
          category: categoryId,
          lat,
          lng,
          description: '',
        }),
      });

      showToast(`Reported: ${categoryLabel}`, result.id);
    } catch (err: any) {
      showToast('Could not submit report', '');
    }
  };

  const undoReport = async () => {
    if (!toast?.reportId) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const idToDelete = toast.reportId;
    setToast(null);

    try {
      await apiRequest(`/reports/${idToDelete}`, { method: 'DELETE' });
    } catch {}
  };

  const markAreaCalm = async () => {
    const result = await broadcastSafeCheckin(reportCoords?.lat, reportCoords?.lng);
    if (result.channel !== 'failed') {
      showToast('Marked selected area as calm & safe', '');
    } else {
      showToast('Could not check in right now', '');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader 
          title="What happened?" 
          subtitle="Tap a category to report at the selected location. You have 6s to undo." 
        />

        {/* 1. Target Location Card */}
        <Pressable onPress={openMapPicker}>
          <Card style={styles.locationCard}>
            <View style={styles.locationRow}>
              <Feather name="map-pin" size={20} color={colors.primary} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.locationLabel}>TARGET LOCATION</Text>
                <Text style={styles.locationCoords}>
                  {reportCoords ? `${reportCoords.lat.toFixed(4)}, ${reportCoords.lng.toFixed(4)}` : 'Detecting GPS...'}
                </Text>
              </View>
              <Text style={styles.changeLocationText}>Change on Map ›</Text>
            </View>
          </Card>
        </Pressable>

        {/* 2. Category Stack */}
        <Card>
          {CATEGORIES.map((cat, index) => (
            <React.Fragment key={cat.id}>
              <ListRow
                title={cat.label}
                left={<Feather name={cat.icon} size={24} color={cat.color} style={styles.categoryIcon} />}
                right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
                onPress={() => submitReport(cat.id, cat.label)}
              />
              {index < CATEGORIES.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </Card>

        {/* 3. Community Calm Action */}
        <Text style={styles.sectionHeading}>Community Check-in</Text>
        <Card>
          <ListRow
            title="Mark area as calm"
            subtitle="Hold for 1s to confirm safety at this location"
            left={<Feather name="shield" size={24} color={colors.safe} style={styles.categoryIcon} />}
            onLongPress={markAreaCalm}
            delayLongPress={900}
          />
        </Card>
      </ScrollView>

      {/* Floating 6s Undo Toast */}
      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastLabel}>{toast.label}</Text>
          {toast.reportId ? (
            <Pressable onPress={undoReport} style={styles.undoButton}>
              <Text style={styles.toastUndo}>Undo (6s)</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: 120 },
  locationCard: { backgroundColor: colors.primaryLight, borderColor: colors.primary, padding: spacing.md, marginBottom: spacing.md },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationLabel: { fontSize: 11, fontWeight: '800', color: colors.primary, letterSpacing: 0.8 },
  locationCoords: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 1 },
  changeLocationText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  categoryIcon: { marginRight: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  sectionHeading: { ...typography.sectionHeading, color: colors.textSecondary, fontSize: 13, marginTop: spacing.md, marginBottom: spacing.xs, letterSpacing: 0.5 },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 90,
    backgroundColor: '#111827',
    borderRadius: radii.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  toastLabel: { color: '#FFFFFF', fontWeight: '600', fontSize: 14, flex: 1 },
  undoButton: { paddingHorizontal: 12, paddingVertical: 4 },
  toastUndo: { color: '#FDE047', fontWeight: '800', fontSize: 14 },
});