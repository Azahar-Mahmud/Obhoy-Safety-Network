import React, { useState, useRef } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

import { ScreenHeader } from '../components';
import { colors, spacing, typography, radii } from '../theme/theme';
import { apiRequest } from '../api/client';
import { broadcastSafeCheckin } from '../utils/safetyCheckin';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportCategory'>;

const CATEGORIES = [
  { id: 'harassment', label: 'Harassment', icon: 'frown' as const },
  { id: 'poor_lighting', label: 'Poor Lighting', icon: 'moon' as const },
  { id: 'unsafe_area', label: 'Unsafe Area', icon: 'alert-triangle' as const },
  { id: 'being_followed', label: 'Being Followed', icon: 'eye' as const },
  { id: 'other', label: 'Other Incident', icon: 'more-horizontal' as const },
];

const UNDO_WINDOW_MS = 6000;

export default function ReportCategoryScreen({ navigation }: Props) {
  useLanguage();
  const [toast, setToast] = useState<{ label: string; reportId: string } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hold-to-fill Animation State for "Mark Calm"
  const [isHolding, setIsHolding] = useState(false);
  const fillAnim = useRef(new Animated.Value(0)).current;

  const showToast = (label: string, reportId: string) => {
    setToast({ label, reportId });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setToast(null), UNDO_WINDOW_MS);
  };

  const submitReport = async (categoryId: string, categoryLabel: string) => {
    try {
      let loc = await Location.getLastKnownPositionAsync().catch(() => null);
      if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      const result = await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({ category: categoryId, lat: loc.coords.latitude, lng: loc.coords.longitude, description: '' }),
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
    try { await apiRequest(`/reports/${idToDelete}`, { method: 'DELETE' }); } catch {}
  };

  const markAreaCalm = async () => {
    const result = await broadcastSafeCheckin();
    if (result.channel !== 'failed') showToast('Marked area as calm & safe', '');
    else showToast('Could not check in right now', '');
  };

  // Radial Fill Logic
  const handlePressIn = () => {
    setIsHolding(true);
    Animated.timing(fillAnim, { toValue: 1, duration: 1000, useNativeDriver: false }).start(({ finished }) => {
      if (finished) { markAreaCalm(); resetAnim(); }
    });
  };
  const handlePressOut = () => { if (isHolding) resetAnim(); };
  const resetAnim = () => {
    setIsHolding(false);
    Animated.timing(fillAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  };
  const fillWidth = fillAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenHeader title="What happened?" subtitle="Tap to report instantly at your location. You have 6 seconds to undo." />

        {/* Vertical Stack of RepCards */}
        <View style={styles.reportStack}>
          {CATEGORIES.map((cat) => (
            <Pressable key={cat.id} style={styles.repCard} android_ripple={{ color: colors.ripple }} onPress={() => submitReport(cat.id, cat.label)}>
              <View style={styles.ricon}>
                <Feather name={cat.icon} size={22} color={colors.primary} />
              </View>
              <Text style={styles.rlabel}>{cat.label}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={typography.sectionHeading}>More ways to help</Text>
        
        <Pressable style={styles.actionCard} android_ripple={{ color: colors.ripple }} onPress={() => navigation.navigate('Map')}>
          <View style={styles.row}>
            <Feather name="radio" size={24} color={colors.caution} style={{ marginRight: 14 }} />
            <View>
              <Text style={styles.actionTitle}>Broadcast alert nearby</Text>
              <Text style={styles.actionHint}>Alerts users within 1km.{'\n'}<Text style={{ color: colors.danger, fontWeight: '700' }}>Does NOT contact police.</Text></Text>
            </View>
          </View>
        </Pressable>

        <Pressable 
          style={styles.actionCard} 
          onPressIn={handlePressIn} 
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.holdFill, { width: fillWidth }]} />
          <View style={[styles.row, { zIndex: 2 }]}>
            <Feather name="shield" size={24} color={colors.safe} style={{ marginRight: 14 }} />
            <View>
              <Text style={styles.actionTitle}>Mark area as calm</Text>
              <Text style={styles.actionHint}>Press & hold to confirm</Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>

      {/* Custom Floating Toast */}
      {toast && (
        <View style={styles.toast}>
          <Text style={styles.toastLabel}>{toast.label}</Text>
          {toast.reportId ? (
            <Pressable onPress={undoReport} style={styles.undoButton}>
              <Text style={styles.toastUndo}>Undo</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center' },
  
  reportStack: { flexDirection: 'column', gap: 10, marginTop: 14, marginBottom: 24 },
  repCard: {
    borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.cardBg,
  },
  ricon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rlabel: { fontSize: 15, fontWeight: '800', flex: 1, color: colors.text },

  actionCard: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 16, backgroundColor: colors.cardBg,
    marginBottom: 12, overflow: 'hidden', position: 'relative'
  },
  actionTitle: { fontWeight: '800', fontSize: 14.5, color: colors.text },
  actionHint: { fontSize: 13, color: colors.text2, marginTop: 2 },
  holdFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.1)' },

  toast: {
    position: 'absolute', left: 16, right: 16, bottom: 40, backgroundColor: '#111827',
    borderRadius: 14, padding: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    elevation: 10, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 5 },
  },
  toastLabel: { color: '#FFFFFF', fontWeight: '600', fontSize: 14, flex: 1 },
  undoButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  toastUndo: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
});