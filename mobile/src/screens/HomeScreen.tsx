import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { signOut } = useAuth();

  // Cache contacts in the background for offline use
  useEffect(() => {
    apiRequest('/contacts')
      .then((contacts) => {
        SecureStore.setItemAsync('obhoy_contacts', JSON.stringify(contacts));
      })
      .catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Obhoy</Text>
      <TouchableOpacity style={styles.sosButton} onPress={() => navigation.navigate('SosCountdown')}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
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
  sosButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#DC2626', justifyContent: 'center', alignItems: 'center', marginBottom: 40, elevation: 4 },
  sosText: { color: '#fff', fontSize: 32, fontWeight: 'bold' },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, alignItems: 'center', width: '100%' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  signOutButton: { marginTop: 24, alignItems: 'center' },
  signOutText: { color: '#DC2626', fontSize: 15 },
});