import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Switch, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { ScreenHeader, Card, ListRow, Button } from '../components';
import { colors, spacing, typography } from '../theme/theme';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'JourneySetup'>;

const INTERVALS = [1, 15, 30, 60];
const RADIUS_OPTIONS = [200, 500, 1000, 2000]; // meters

export default function JourneySetupScreen({ navigation, route }: Props) {
  useLanguage();
  
  // Origin & Destination points
  const [fromPoint, setFromPoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [toPoint, setToPoint] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [destinationLabel, setDestinationLabel] = useState('');

  // Mode and Timer Settings
  const [mode, setMode] = useState<'interval' | 'scheduled'>('interval');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [showPicker, setShowPicker] = useState(false);
  const [interval, setInterval_] = useState(30);

  // Geofence Settings
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [radius, setRadius] = useState(500);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-detect current position for "From"
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const last = await Location.getLastKnownPositionAsync().catch(() => null);
        if (last) {
          setFromPoint({ lat: last.coords.latitude, lng: last.coords.longitude, label: 'Current Location' });
        } else {
          const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setFromPoint({ lat: fresh.coords.latitude, lng: fresh.coords.longitude, label: 'Current Location' });
        }
      }
    })();
  }, []);

  // Handle returning from MapPointPickerScreen
  useEffect(() => {
    const params = route.params;
    if (params?.pickedLat != null && params?.pickedLng != null && params?.targetField) {
      const point = {
        lat: params.pickedLat,
        lng: params.pickedLng,
        label: `${params.pickedLat.toFixed(4)}, ${params.pickedLng.toFixed(4)}`,
      };

      if (params.targetField === 'from') {
        setFromPoint(point);
      } else if (params.targetField === 'to') {
        setToPoint(point);
      }
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
    if (!toPoint) {
      setError('Please select a destination point on the map.');
      return;
    }

    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location permission is required.');
      
      // Resolve start coordinates cleanly
      let startLat = fromPoint?.lat;
      let startLng = fromPoint?.lng;

      if (startLat == null || startLng == null) {
        const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        startLat = fresh.coords.latitude;
        startLng = fresh.coords.longitude;
      }

      const data = await apiRequest('/journey/start', {
        method: 'POST',
        body: JSON.stringify({
          destinationLabel: destinationLabel.trim() || toPoint.label,
          destinationLat: toPoint.lat,
          destinationLng: toPoint.lng,
          originLat: startLat,
          originLng: startLng,
          mode,
          checkinIntervalMinutes: mode === 'interval' ? interval : undefined,
          scheduledDeadline: mode === 'scheduled' ? deadline.toISOString() : undefined,
          lat: startLat,
          lng: startLng,
          accuracy: 10,
          geofenceEnabled: mode === 'interval' ? geofenceEnabled : false,
          geofenceRadiusMeters: mode === 'interval' && geofenceEnabled ? radius : undefined,
        }),
      });

      navigation.replace('ActiveJourney', {
        journeyId: data.journeyId,
        checkinIntervalMinutes: interval,
        mode,
        scheduledDeadline: mode === 'scheduled' ? deadline.toISOString() : undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Could not start journey.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Start a Journey" subtitle="Select your route and check-in preferences" />

      {/* 1. Route Points Card */}
      <Card>
        <ListRow
          title="From (Starting Point)"
          subtitle={fromPoint?.label || 'Locating GPS...'}
          left={<Feather name="circle" size={20} color={colors.safe} style={styles.icon} />}
          right={<Feather name="map-pin" size={18} color={colors.primary} />}
          onPress={() => openMapPicker('from')}
        />
        <View style={styles.divider} />
        <ListRow
          title="To (Destination Point)"
          subtitle={toPoint ? toPoint.label : 'Tap to select on map *'}
          left={<Feather name="map-pin" size={20} color={colors.danger} style={styles.icon} />}
          right={<Feather name="chevron-right" size={18} color={colors.primary} />}
          onPress={() => openMapPicker('to')}
        />
      </Card>

      {/* Optional Label */}
      <Text style={styles.inputLabel}>Destination Name (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Home, Campus, Library"
        value={destinationLabel}
        onChangeText={setDestinationLabel}
        placeholderTextColor={colors.textSecondary}
      />

      {/* 2. Mode Selector */}
      <View style={styles.modeRow}>
        <Button
          label="Recurring Check-in"
          variant={mode === 'interval' ? 'primary' : 'outline'}
          style={styles.modeBtn}
          onPress={() => setMode('interval')}
        />
        <Button
          label="One-Time Deadline"
          variant={mode === 'scheduled' ? 'primary' : 'outline'}
          style={styles.modeBtn}
          onPress={() => setMode('scheduled')}
        />
      </View>

      {/* 3. Conditional Mode Options */}
      {mode === 'scheduled' ? (
        <Card>
          <Text style={styles.cardHeader}>Safety Confirmation Deadline</Text>
          <Button
            label={`Confirm by ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            variant="outline"
            onPress={() => setShowPicker(true)}
          />
          {showPicker && (
            <DateTimePicker
              value={deadline}
              mode="time"
              display="default"
              onChange={(event, selected) => {
                setShowPicker(false);
                if (selected) setDeadline(selected);
              }}
            />
          )}
        </Card>
      ) : (
        <Card>
          <Text style={styles.cardHeader}>Check in every</Text>
          <View style={styles.intervalRow}>
            {INTERVALS.map((mins) => (
              <Button
                key={mins}
                label={`${mins}m`}
                variant={interval === mins ? 'primary' : 'outline'}
                style={styles.intervalBtn}
                onPress={() => setInterval_(mins)}
              />
            ))}
          </View>

          <View style={styles.divider} />

          {/* Safe Zone Geofence */}
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchLabel}>Safe Zone Alert</Text>
              <Text style={styles.switchSub}>Alert contacts if I leave starting radius</Text>
            </View>
            <Switch
              value={geofenceEnabled}
              onValueChange={setGeofenceEnabled}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
            />
          </View>

          {geofenceEnabled && (
            <View style={styles.intervalRow}>
              {RADIUS_OPTIONS.map((meters) => (
                <Button
                  key={meters}
                  label={meters >= 1000 ? `${meters / 1000}km` : `${meters}m`}
                  variant={radius === meters ? 'primary' : 'outline'}
                  style={styles.intervalBtn}
                  onPress={() => setRadius(meters)}
                />
              ))}
            </View>
          )}
        </Card>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button
        label={loading ? 'Starting...' : 'Start Journey'}
        variant="primary"
        onPress={handleStart}
        disabled={loading}
        style={styles.startBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl + 20 },
  icon: { marginRight: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { 
    backgroundColor: '#FFFFFF', 
    borderWidth: 1, 
    borderColor: colors.border, 
    borderRadius: 12, 
    padding: spacing.md, 
    fontSize: 16, 
    color: colors.textPrimary,
    marginBottom: spacing.md 
  },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modeBtn: { flex: 1, paddingVertical: spacing.md },
  cardHeader: { ...typography.sectionHeading, fontSize: 15, color: colors.textPrimary, marginBottom: spacing.sm },
  intervalRow: { flexDirection: 'row', gap: spacing.xs, marginVertical: spacing.xs },
  intervalBtn: { flex: 1, paddingVertical: spacing.sm },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  switchLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  switchSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  error: { color: colors.danger, textAlign: 'center', marginVertical: spacing.sm, fontWeight: '600' },
  startBtn: { marginTop: spacing.sm },
});