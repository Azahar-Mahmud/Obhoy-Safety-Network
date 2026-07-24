import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, FlatList } from 'react-native';

const NUMBERS = [
  { label: 'National Emergency (Police / Fire / Ambulance)', number: '999' },
  { label: 'Women & Child Helpline', number: '109' },
  { label: 'Child Helpline', number: '1098' },
  { label: 'Disaster Helpline', number: '1090' },
];

export default function DirectoryScreen() {
  const call = (number: string) => Linking.openURL(`tel:${number}`);

  return (
    <View style={styles.container}>
      <FlatList
        data={NUMBERS}
        keyExtractor={(item) => item.number}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => call(item.number)}>
            <Text style={styles.label}>{item.label}</Text>
            <Text style={styles.number}>{item.number}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFFFFF' },
  card: {
    backgroundColor: '#EDE9FE',
    borderRadius: 8,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 16, color: '#111827', flex: 1, marginRight: 12 },
  number: { fontSize: 24, fontWeight: 'bold', color: '#6B21A8' },
});