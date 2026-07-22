import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'JourneySetup'>;
const INTERVALS = [1, 15, 30, 60];

export default function JourneySetupScreen({ navigation }: Props) {
  const [destinationLabel, setDestinationLabel] = useState('');
  const [interval, setInterval_] = useState(30);
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
          checkinIntervalMinutes: interval,
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
        }),
      });
      navigation.replace('ActiveJourney', { journeyId: data.journeyId, checkinIntervalMinutes: interval });
    } catch (err: any) {
      setError(err.message || 'Could not start journey.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Where are you headed?</Text>
      <TextInput style={styles.input} placeholder="e.g. Home" value={destinationLabel} onChangeText={setDestinationLabel} />
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
  intervalRow: { flexDirection: 'row', marginBottom: 24 },
  intervalButton: { flex: 1, borderWidth: 1, borderColor: '#6B21A8', borderRadius: 8, padding: 12, marginRight: 8, alignItems: 'center' },
  intervalButtonActive: { backgroundColor: '#6B21A8' },
  intervalText: { color: '#6B21A8', fontWeight: 'bold' },
  intervalTextActive: { color: '#fff' },
  button: { backgroundColor: '#D97706', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  error: { color: '#DC2626', marginBottom: 12 },
});