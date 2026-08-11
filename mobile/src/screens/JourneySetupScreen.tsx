import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker'; // --- STEP 6: Import Time Picker ---
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'JourneySetup'>;
const INTERVALS = [1, 15, 30, 60];
const RADIUS_OPTIONS = [200, 500, 1000, 2000]; // meters

export default function JourneySetupScreen({ navigation }: Props) {
  const [destinationLabel, setDestinationLabel] = useState('');
  
  // --- STEP 6: Mode and Deadline State ---
  const [mode, setMode] = useState<'interval' | 'scheduled'>('interval');
  const [deadline, setDeadline] = useState(new Date(Date.now() + 60 * 60 * 1000)); // default: 1 hour out
  const [showPicker, setShowPicker] = useState(false);
  // ---------------------------------------

  const [interval, setInterval_] = useState(30);
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [radius, setRadius] = useState(500);
  const [error, setError] = useState('');

  const handleStart = async () => {
    setError('');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location permission is required.');
      const { coords } = await Location.getCurrentPositionAsync({});
      
      const data = await apiRequest('/journey/start', {
        method: 'POST',
        body: JSON.stringify({
          destinationLabel,
          // --- STEP 6: Send mode and conditionally send interval/deadline ---
          mode,
          checkinIntervalMinutes: mode === 'interval' ? interval : undefined,
          scheduledDeadline: mode === 'scheduled' ? deadline.toISOString() : undefined,
          // ------------------------------------------------------------------
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          geofenceEnabled: mode === 'interval' ? geofenceEnabled : false,
          geofenceRadiusMeters: mode === 'interval' && geofenceEnabled ? radius : undefined,
        }),
      });
      
      navigation.replace('ActiveJourney', { 
        journeyId: data.journeyId, 
        checkinIntervalMinutes: interval,
        // --- STEP 6: Pass new params to next screen ---
        mode,
        scheduledDeadline: mode === 'scheduled' ? deadline.toISOString() : undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Could not start journey.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where are you headed?</Text>
      <TextInput style={styles.input} placeholder="e.g. Home" value={destinationLabel} onChangeText={setDestinationLabel} />
      
      {/* --- STEP 6: Mode Toggle --- */}
      <View style={styles.modeRow}>
        <TouchableOpacity style={[styles.modeButton, mode === 'interval' && styles.modeButtonActive]} onPress={() => setMode('interval')}>
          <Text style={[styles.modeText, mode === 'interval' && styles.modeTextActive]}>Recurring check-ins</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeButton, mode === 'scheduled' && styles.modeButtonActive]} onPress={() => setMode('scheduled')}>
          <Text style={[styles.modeText, mode === 'scheduled' && styles.modeTextActive]}>One-time deadline</Text>
        </TouchableOpacity>
      </View>
      {/* --------------------------- */}

      {/* --- STEP 6: Conditional UI based on Mode --- */}
      {mode === 'scheduled' ? (
        <>
          <Text style={styles.label}>Alert my contacts if I haven't confirmed safety by:</Text>
          <TouchableOpacity style={styles.timeButton} onPress={() => setShowPicker(true)}>
            <Text style={styles.timeButtonText}>
              {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>
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
        </>
      ) : (
        <>
          <Text style={styles.label}>Check in every</Text>
          <View style={styles.intervalRow}>
            {INTERVALS.map((mins) => (
              <TouchableOpacity
                key={mins}
                style={[styles.intervalButton, interval === mins && styles.intervalButtonActive]}
                onPress={() => setInterval_(mins)}
              >
                <Text style={[styles.intervalText, interval === mins && styles.intervalTextActive]}>{mins} min</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Alert if I leave a safe zone</Text>
            <Switch 
              value={geofenceEnabled} 
              onValueChange={setGeofenceEnabled} 
              trackColor={{ false: '#D1D5DB', true: '#6B21A8' }} 
            />
          </View>
          
          {geofenceEnabled && (
            <View style={styles.intervalRow}>
              {RADIUS_OPTIONS.map((meters) => (
                <TouchableOpacity
                  key={meters}
                  style={[styles.intervalButton, radius === meters && styles.intervalButtonActive]}
                  onPress={() => setRadius(meters)}
                >
                  <Text style={[styles.intervalText, radius === meters && styles.intervalTextActive]}>
                    {meters >= 1000 ? `${meters / 1000}km` : `${meters}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
      {/* ------------------------------------------- */}

      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Start Journey</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  input: { borderWidth: 1, borderColor: '#6B7280', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 20 },
  label: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  
  // --- STEP 6: New Styles for Mode Toggle and Time Picker ---
  modeRow: { flexDirection: 'row', marginBottom: 16, gap: 8 },
  modeButton: { flex: 1, borderWidth: 1, borderColor: '#6B21A8', borderRadius: 8, padding: 12, alignItems: 'center' },
  modeButtonActive: { backgroundColor: '#6B21A8' },
  modeText: { color: '#6B21A8', fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  timeButton: { borderWidth: 1, borderColor: '#6B21A8', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 16 },
  timeButtonText: { color: '#6B21A8', fontSize: 18, fontWeight: 'bold' },
  // ----------------------------------------------------------

  intervalRow: { flexDirection: 'row', marginBottom: 24 },
  intervalButton: { flex: 1, borderWidth: 1, borderColor: '#6B21A8', borderRadius: 8, padding: 12, marginRight: 8, alignItems: 'center' },
  intervalButtonActive: { backgroundColor: '#6B21A8' },
  intervalText: { color: '#6B21A8', fontWeight: 'bold' },
  intervalTextActive: { color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  button: { backgroundColor: '#D97706', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  error: { color: '#DC2626', marginBottom: 12 },
});