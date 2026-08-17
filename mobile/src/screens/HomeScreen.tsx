import * as Location from 'expo-location';
import { ensureSmsPermission } from '../utils/sos';
import { useEffect, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';

// SILENT MODE
import { useSilentMode } from '../context/SilentModeContext';
import { runSilentSos } from '../utils/silentSos';

// Broadcast Check-in Utility
import { broadcastSafeCheckin } from '../utils/safetyCheckin';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  useLanguage();
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

  // --- ANTI-SLIP: Hold for 900ms to trigger SOS ---
  const handleSosLongPress = () => {
    if (silentModeEnabled) {
      runSilentSos(); 
    } else {
      navigation.navigate('SosCountdown');
    }
  };

  // Brief touch gives helpful feedback instead of accidentally firing an emergency
  const handleSosPress = () => {
    Alert.alert('Obhoy SOS', 'Press and hold the SOS button for 1 second to trigger an emergency alert.');
  };

  const handleSafeCheckin = async () => {
    const result = await broadcastSafeCheckin();
    Alert.alert(
      t('home.i_am_safe'),
      result.channel === 'failed' ? t('sos.channel_failed') : t('msg.safe_checkin')
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Obhoy</Text>

      {/* SOS Button with 900ms Anti-Slip Press-and-Hold */}
      <TouchableOpacity 
        style={styles.sosButton} 
        onPress={handleSosPress}
        onLongPress={handleSosLongPress}
        delayLongPress={900}
        activeOpacity={0.8}
      >
        <Text style={styles.sosText}>{t('home.sos')}</Text>
        <Text style={styles.sosSubtext}>HOLD 1s</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.safeCheckinButton} onPress={handleSafeCheckin}>
        <Text style={styles.safeCheckinText}>{t('home.i_am_safe')}</Text>
      </TouchableOpacity>

      {/* Family Live Location Button */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Family')}>
        <Text style={styles.buttonText}>{t('home.family')}</Text>
      </TouchableOpacity>

      {activeJourney ? (
        <TouchableOpacity
          style={styles.journeyButton}
          onPress={() => navigation.navigate('ActiveJourney', {
            journeyId: activeJourney._id,
            checkinIntervalMinutes: activeJourney.checkinIntervalMinutes,
          })}
        >
          <Text style={styles.buttonText}>{t('home.journey')}</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('JourneySetup')}>
          <Text style={styles.buttonText}>{t('journey.start')}</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('ContactsList')}>
        <Text style={styles.buttonText}>{t('home.contacts')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Directory')}>
        <Text style={styles.buttonText}>{t('home.directory')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Map')}>
        <Text style={styles.buttonText}>{t('home.map')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('NearbyAlerts')}>
        <Text style={styles.buttonText}>{t('home.nearby_alerts')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.buttonText}>{t('home.settings')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>{t('auth.logout')}</Text>
      </TouchableOpacity>

      {/* DISCREET EVIDENCE CAPTURE BUTTON */}
      <TouchableOpacity
        style={styles.evidenceButton}
        onLongPress={() => (navigation as any).navigate('EvidenceCapture')}
        delayLongPress={1500}
      >
        <Text style={styles.evidenceButtonText}>⏺</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#6B21A8', marginBottom: 20 },
  sosButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center', marginBottom: 12, elevation: 4 },
  sosText: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  sosSubtext: { color: '#FEF2F2', fontSize: 11, fontWeight: 'bold', marginTop: 2, opacity: 0.9 },
  safeCheckinButton: { backgroundColor: '#16A34A', borderRadius: 8, padding: 14, minHeight: 48, alignItems: 'center', width: '100%', marginBottom: 16 },
  safeCheckinText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  journeyButton: { backgroundColor: '#D97706', borderRadius: 8, padding: 16, minHeight: 52, alignItems: 'center', width: '100%', marginBottom: 12 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, minHeight: 52, alignItems: 'center', width: '100%', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  signOutButton: { marginTop: 12, marginBottom: 40, alignItems: 'center' },
  signOutText: { color: '#DC2626', fontSize: 15 },
  evidenceButton: { position: 'absolute', bottom: 24, right: 24, width: 44, height: 44, borderRadius: 22, backgroundColor: '#EDE9FE', justifyContent: 'center', alignItems: 'center' },
  evidenceButtonText: { fontSize: 16, color: '#6B7280' },
});