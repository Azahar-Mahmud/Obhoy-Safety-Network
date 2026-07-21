import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
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

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{item.phone} · {item.relationship}</Text>
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
  card: { backgroundColor: '#EDE9FE', borderRadius: 8, padding: 16, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  phone: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});