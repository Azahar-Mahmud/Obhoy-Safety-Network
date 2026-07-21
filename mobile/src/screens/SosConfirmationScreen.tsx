import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'SosConfirmation'>;

export default function SosConfirmationScreen({ route, navigation }: Props) {
  const { channel, contactsNotified, error } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{channel === 'failed' ? 'SOS could not be sent' : 'SOS Sent'}</Text>
      <Text style={styles.subtitle}>
        {channel === 'backend' && 'Sent via internet.'}
        {channel === 'native' && 'Sent directly by SMS (no internet available).'}
        {channel === 'failed' && (error || 'Please try again.')}
      </Text>
      <FlatList
        data={contactsNotified || []}
        keyExtractor={(item, i) => item.phone || String(i)}
        renderItem={({ item }) => (
          <View style={styles.contactRow}>
            <Text style={styles.contactName}>{item.name}</Text>
            <Text style={item.status === 'sent' ? styles.statusOk : styles.statusFail}>
              {item.status === 'sent' ? '✓ Sent' : '✗ Failed'}
            </Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.button} onPress={() => navigation.popToTop()}>
        <Text style={styles.buttonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#EDE9FE', borderRadius: 8, padding: 14, marginBottom: 8 },
  contactName: { fontSize: 16, color: '#111827' },
  statusOk: { color: '#16A34A', fontWeight: 'bold' },
  statusFail: { color: '#DC2626', fontWeight: 'bold' },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});