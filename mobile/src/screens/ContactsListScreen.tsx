import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'ContactsList'>;
type Contact = { _id: string; name: string; phone: string; relationship: string };

export default function ContactsListScreen({ navigation }: Props) {
  const [contacts, setContacts] = useState<Contact[]>([]);

  const loadContacts = useCallback(() => {
    apiRequest('/contacts').then(setContacts).catch(() => {});
  }, []);

  useFocusEffect(useCallback(() => { loadContacts(); }, [loadContacts]));

  const handleDelete = (contact: Contact) => {
    Alert.alert('Remove contact', `Remove ${contact.name} from your trusted contacts?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRequest(`/contacts/${contact._id}`, { method: 'DELETE' });
            loadContacts();
          } catch (err: any) {
            Alert.alert('Could not remove contact', err.message || 'Please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.phone}>{item.phone} · {item.relationship}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No trusted contacts yet.</Text>}
      />
      {contacts.length < 5 && (
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AddContact')}>
          <Text style={styles.buttonText}>+ Add Contact</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EDE9FE', borderRadius: 8, padding: 16, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  phone: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  removeText: { color: '#DC2626', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});