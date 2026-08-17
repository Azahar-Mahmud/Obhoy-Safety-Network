import React, { useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

import { ScreenHeader, ListRow, Card } from '../components';
import { colors, spacing, typography } from '../theme/theme';
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

const UNDO_WINDOW_MS = 6000; // 6-second undo window

export default function ReportCategoryScreen({ navigation }: Props) {
  useLanguage();
  const [toast, setToast] = useState<{ label: string; reportId: string } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (label: string, reportId: string) => {
    setToast({ label, reportId });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setToast(null), UNDO_WINDOW_MS);
  };

  // Instant 1-tap report submission
  const submitReport = async (categoryId: string, categoryLabel: string) => {
    try {
      let loc = await Location.getLastKnownPositionAsync().catch(() => null);
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }

      const result = await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({
          category: categoryId,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          description: '',
        }),
      });

      showToast(`Reported: ${categoryLabel}`, result.id);
    } catch (err: any) {
      showToast('Could not submit report', '');
    }
  };

  // Undo button action
  const undoReport = async () => {
    if (!toast?.reportId) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    const idToDelete = toast.reportId;
    setToast(null);

    try {
      await apiRequest(`/reports/${idToDelete}`, { method: 'DELETE' });
    } catch {}
  };

  // Mark area as calm (Community Safety Check-in from Obhoy_27)
  const markAreaCalm = async () => {
    const result = await broadcastSafeCheckin();
    if (result.channel !== 'failed') {
      showToast('Marked area as calm & safe', '');
    } else {
      showToast('Could not check in right now', '');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader 
          title="What happened?" 
          subtitle="Tap a category to report instantly. You have 6 seconds to undo." 
        />

        {/* 1. Category Vertical Stack */}
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

        {/* 2. Secondary Community Actions */}
        <Text style={styles.sectionHeading}>More ways to help</Text>
        
        <Card>
          <ListRow
            title="Warn nearby users"
            subtitle="Broadcast an anonymous live alert"
            left={<Feather name="radio" size={24} color={colors.caution} style={styles.categoryIcon} />}
            right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
            onPress={() => navigation.navigate('Map')}
          />
          <View style={styles.divider} />
          <ListRow
            title="Mark area as calm"
            subtitle="Hold for 1s to confirm community safety check-in"
            left={<Feather name="shield" size={24} color={colors.safe} style={styles.categoryIcon} />}
            onLongPress={markAreaCalm}
            delayLongPress={900}
          />
        </Card>
      </ScrollView>

      {/* 3. Floating 6-Second Undo Toast */}
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + 40 },
  categoryIcon: { marginRight: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  sectionHeading: { ...typography.sectionHeading, color: colors.textSecondary, fontSize: 16, marginTop: spacing.md, marginBottom: spacing.sm },
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    backgroundColor: colors.textPrimary,
    borderRadius: 12,
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