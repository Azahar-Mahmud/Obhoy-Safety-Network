import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useLanAlerts } from '../context/LanAlertContext';

export default function NearbyAlertsScreen() {
  const { alerts } = useLanAlerts();

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item, i) => item.sentAt + i}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.message}>{item.message}</Text>
            <Text style={styles.time}>{new Date(item.receivedAt).toLocaleTimeString()}</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => Linking.openURL(`https://www.google.com/maps?q=${item.lat},${item.lng}`)}
            >
              <Text style={styles.buttonText}>View Location</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No nearby alerts right now.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { backgroundColor: '#EDE9FE', borderRadius: 8, padding: 16, marginBottom: 10 },
  message: { fontSize: 16, color: '#111827' },
  time: { fontSize: 13, color: '#6B7280', marginTop: 4, marginBottom: 10 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
});