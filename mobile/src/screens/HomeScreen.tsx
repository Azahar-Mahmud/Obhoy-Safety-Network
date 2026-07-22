import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { signOut } = useAuth();
  const [activeJourney, setActiveJourney] = useState<any>(null);

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Obhoy</Text>
      <TouchableOpacity style={styles.sosButton} onPress={() => navigation.navigate('SosCountdown')}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
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
      <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
        <Text style={styles.signOutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#6B21A8', marginBottom: 32 },
  sosButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center', marginBottom: 24, elevation: 4 },
  sosText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  journeyButton: { backgroundColor: '#D97706', borderRadius: 8, padding: 16, alignItems: 'center', width: '100%', marginBottom: 12 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, alignItems: 'center', width: '100%', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  signOutButton: { marginTop: 12, alignItems: 'center' },
  signOutText: { color: '#DC2626', fontSize: 15 },
});