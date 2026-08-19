import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, ScrollView, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { ScreenHeader, Card, ListRow, Button, Toggle } from '../components';
import { colors, spacing, typography, radii } from '../theme/theme';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'JourneySetup'>;

const INTERVALS = [15, 30, 45, 60];

export default function JourneySetupScreen({ navigation, route }: Props) {
  useLanguage();
  
  const [fromPoint, setFromPoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [toPoint, setToPoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [destinationLabel, setDestinationLabel] = useState('');

  const [mode, setMode] = useState<'interval' | 'scheduled'>('interval');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [showPicker, setShowPicker] = useState(false);
  const [interval, setInterval_] = useState(30);

  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const last = await Location.getLastKnownPositionAsync().catch(() => null);
        if (last) setFromPoint({ lat: last.coords.latitude, lng: last.coords.longitude, label: 'Current Location' });
        else {
          const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setFromPoint({ lat: fresh.coords.latitude, lng: fresh.coords.longitude, label: 'Current Location' });
        }
      }
    })();
  }, []);

  useEffect(() => {
    const params = route.params;
    if (params?.pickedLat != null && params?.pickedLng != null && params?.targetField) {
      const point = { lat: params.pickedLat, lng: params.pickedLng, label: `${params.pickedLat.toFixed(4)}, ${params.pickedLng.toFixed(4)}` };
      if (params.targetField === 'from') setFromPoint(point);
      else if (params.targetField === 'to') setToPoint(point);
    }
  }, [route.params]);

  const openMapPicker = (field: 'from' | 'to') => {
    const activePoint = field === 'from' ? fromPoint : toPoint;
    navigation.navigate('MapPointPicker', {
      title: field === 'from' ? 'Set Starting Point' : 'Set Destination Point',
      initialLat: activePoint?.lat ?? fromPoint?.lat ?? 23.8103,
      initialLng: activePoint?.lng ?? fromPoint?.lng ?? 90.4125,
      targetField: field,
    });
  };

  const handleStart = async () => {
    setError('');
    if (!toPoint) { setError('Please select a destination point on the map.'); return; }
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location permission is required.');
      
      let startLat = fromPoint?.lat; let startLng = fromPoint?.lng;
      if (startLat == null || startLng == null) {
        const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        startLat = fresh.coords.latitude; startLng = fresh.coords.longitude;
      }

      const data = await apiRequest('/journey/start', {
        method: 'POST',
        body: JSON.stringify({
          destinationLabel: destinationLabel.trim() || toPoint.label,
          destinationLat: toPoint.lat, destinationLng: toPoint.lng,
          originLat: startLat, originLng: startLng,
          mode, checkinIntervalMinutes: mode === 'interval' ? interval : undefined,
          scheduledDeadline: mode === 'scheduled' ? deadline.toISOString() : undefined,
          lat: startLat, lng: startLng, accuracy: 10,
          geofenceEnabled: mode === 'interval' ? geofenceEnabled : false,
          geofenceRadiusMeters: mode === 'interval' && geofenceEnabled ? 500 : undefined,
        }),
      });

      navigation.replace('ActiveJourney', {
        journeyId: data.journeyId, checkinIntervalMinutes: interval, mode,
        scheduledDeadline: mode === 'scheduled' ? deadline.toISOString() : undefined,
      });
    } catch (err: any) { setError(err.message || 'Could not start journey.'); } 
    finally { setLoading(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}><Feather name="x" size={24} color={colors.text} /></Pressable>
        <Text style={typography.screenTitle}>New Journey</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Segmented Control */}
        <View style={styles.segCtrl}>
          <Pressable style={[styles.segBtn, mode === 'interval' && styles.segBtnActive]} onPress={() => setMode('interval')}>
            <Text style={[styles.segBtnText, mode === 'interval' && {color: colors.primary}]}>Recurring Check-in</Text>
          </Pressable>
          <Pressable style={[styles.segBtn, mode === 'scheduled' && styles.segBtnActive]} onPress={() => setMode('scheduled')}>
            <Text style={[styles.segBtnText, mode === 'scheduled' && {color: colors.primary}]}>One-Time Deadline</Text>
          </Pressable>
        </View>

        <Text style={styles.fieldLabel}>Route</Text>
        <View style={styles.inputGroup}>
          <Feather name="circle" size={18} color={colors.text2} style={styles.iconLeft} />
          <TextInput style={[styles.input, { color: colors.text2, fontWeight: '600' }]} value="Current Location (Auto)" editable={false} />
        </View>
        <Pressable style={styles.inputGroup} onPress={() => openMapPicker('to')}>
          <Feather name="map-pin" size={18} color={colors.primary} style={[styles.iconLeft, { color: colors.primary }]} />
          <TextInput style={[styles.input, { color: colors.primary, fontWeight: '700', backgroundColor: colors.primaryTint, borderColor: colors.primaryLight }]} value={toPoint ? 'Location Selected' : "Tap map to select destination"} editable={false} pointerEvents="none" />
        </Pressable>

        <TextInput style={styles.input} placeholder="Destination Name (Optional, e.g. Home)" placeholderTextColor={colors.text2} value={destinationLabel} onChangeText={setDestinationLabel} />

        <Text style={styles.fieldLabel}>Notify</Text>
        <View style={styles.chipRow}>
          <View style={[styles.chip, styles.chipSelected]}><Text style={styles.chipTextSelected}>Ammu</Text></View>
          <View style={[styles.chip, styles.chipSelected]}><Text style={styles.chipTextSelected}>Rafiq Bhai</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>+ Add</Text></View>
        </View>

        {mode === 'scheduled' ? (
          <>
            <Text style={styles.fieldLabel}>Expected arrival deadline</Text>
            <Button label={deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} variant="outline" onPress={() => setShowPicker(true)} />
            {showPicker && (
              <DateTimePicker value={deadline} mode="time" display="default" onChange={(event, selected) => { setShowPicker(false); if (selected) setDeadline(selected); }} />
            )}
          </>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Check in every</Text>
            <View style={styles.chipRow}>
              {INTERVALS.map((mins) => (
                <Pressable key={mins} style={[styles.chip, interval === mins && styles.chipSelected]} onPress={() => setInterval_(mins)}>
                  <Text style={[styles.chipText, interval === mins && styles.chipTextSelected]}>{mins}m</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.switchLabel}>Safe Zone Alert</Text>
                <Text style={styles.switchSub}>Alert contacts if leaving start radius</Text>
              </View>
              <Toggle value={geofenceEnabled} onChange={setGeofenceEnabled} />
            </View>
          </>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button label={loading ? 'Starting...' : 'Start Journey'} variant="primary" onPress={handleStart} disabled={loading} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginTop: 40, marginBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardBg },
  content: { padding: spacing.xl, paddingBottom: 100 },
  
  segCtrl: { flexDirection: 'row', backgroundColor: colors.inputBg, borderRadius: radii.md, padding: 3, borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radii.sm },
  segBtnActive: { backgroundColor: colors.cardBg, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  segBtnText: { fontSize: 13.5, fontWeight: '700', color: colors.text2 },
  
  inputGroup: { position: 'relative', marginBottom: 8 },
  iconLeft: { position: 'absolute', left: 14, top: 22, zIndex: 2 },
  input: { backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, padding: 16, paddingLeft: 42, fontSize: 16, color: colors.text, marginBottom: 12 },
  
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.text2, marginBottom: 8, marginTop: 12 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  chip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.cardBg },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '700', color: colors.text2 },
  chipTextSelected: { fontSize: 14, fontWeight: '700', color: '#fff' },

  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 20 },
  switchLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  switchSub: { fontSize: 13, color: colors.text2, marginTop: 2 },
  
  error: { color: colors.danger, textAlign: 'center', marginVertical: spacing.sm, fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 24, paddingBottom: 34, backgroundColor: colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24, elevation: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: -4 } }
});