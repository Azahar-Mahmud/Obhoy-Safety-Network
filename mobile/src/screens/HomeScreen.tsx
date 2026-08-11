import * as Location from 'expo-location';
import { ensureSmsPermission } from '../utils/sos';
import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

// SILENT MODE
import { useSilentMode } from '../context/SilentModeContext';
import { runSilentSos } from '../utils/silentSos';

// --- STEP 4: Import Broadcast Check-in Utility ---
import { broadcastSafeCheckin } from '../utils/safetyCheckin';
// -------------------------------------------------

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [activeJourney, setActiveJourney] = useState<any>(null);
  
  const { silentModeEnabled } = useSilentMode();

  useFocusEffect(
    useCallback(() => {
      apiRequest('/contacts')
        .then((contacts) => SecureStore.setItemAsync('obhoy_contacts', JSON.stringify(contacts)))
        .catch(() => {});
      apiRequest('/journey/active')
        .then(setActiveJourney)
        .catch(() => setActiveJourney(null));
    }, [])
  );

  useEffect(() => {
    Location.requestForegroundPermissionsAsync();
    ensureSmsPermission();
  }, []);

  const handleSosPress = () => {
    if (!silentModeEnabled) {
      navigation.navigate('SosCountdown');
    }
  };

  const handleSosLongPress = () => {
    if (silentModeEnabled) {
      runSilentSos(); 
    }
  };

  // --- STEP 4: Handle "I Am Safe" Button Press ---
  const handleSafeCheckin = async () => {
    const result = await broadcastSafeCheckin();
    Alert.alert('Checked in', result.channel === 'failed' ? 'Could not broadcast right now.' : 'Marked as safe nearby.');
  };
  // -----------------------------------------------

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Obhoy</Text>
      
      <TouchableOpacity 
        style={styles.sosButton} 
        onPress={handleSosPress}
        onLongPress={handleSosLongPress}
        delayLongPress={2000}
      >
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>

      {/* --- STEP 4: Render the new green "I Am Safe" button --- */}
      <TouchableOpacity style={styles.safeCheckinButton} onPress={handleSafeCheckin}>
        <Text style={styles.safeCheckinText}>I Am Safe</Text>
      </TouchableOpacity>
      {/* ------------------------------------------------------- */}

      {activeJourney ? (
        <TouchableOpacity
          style={styles.journeyButton}
          onPress={() => navigation.navigate('ActiveJourney', {
            journeyId: activeJourney._id,
            checkinIntervalMinutes: activeJourney.checkinIntervalMinutes,
          })}
        >
          <Text style={styles.buttonText}>View Active Journey</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('JourneySetup')}>
          <Text style={styles.buttonText}>Start Journey</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ContactsList')}>
        <Text style={styles.buttonText}>Trusted Contacts</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Directory')}>
        <Text style={styles.buttonText}>Emergency Directory</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Map')}>
        <Text style={styles.buttonText}>Unsafe Zone Map</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('NearbyAlerts')}>
        <Text style={styles.buttonText}>Nearby Alerts</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.buttonText}>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Log out</Text>
      </TouchableOpacity>

      {/* DISCREET EVIDENCE CAPTURE BUTTON */}
      <TouchableOpacity
        style={styles.evidenceButton}
        onLongPress={() => (navigation as any).navigate('EvidenceCapture')}
        delayLongPress={1500}
      >
        <Text style={styles.evidenceButtonText}>⏺</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#6B21A8', marginBottom: 24 },
  
  // Note: I changed the SOS button marginBottom to 12 so the "I Am Safe" button sits closer to it visually
  sosButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 4 },
  sosText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  
  // --- STEP 4: New Button Styles ---
  safeCheckinButton: { backgroundColor: '#16A34A', borderRadius: 8, padding: 14, alignItems: 'center', width: '100%', marginBottom: 24 },
  safeCheckinText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  // ---------------------------------

  journeyButton: { backgroundColor: '#D97706', borderRadius: 8, padding: 16, alignItems: 'center', width: '100%', marginBottom: 12 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, alignItems: 'center', width: '100%', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  signOutButton: { marginTop: 12, alignItems: 'center' },
  signOutText: { color: '#DC2626', fontSize: 15 },
  evidenceButton: { position: 'absolute', bottom: 24, right: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  evidenceButtonText: { fontSize: 16, color: '#6B7280' },
});