import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, FlatList } from 'react-native';
import { t, useLanguage } from '../i18n';

export default function DirectoryScreen() {
  useLanguage();

  const numbers = [
    { key: 'dir.police', label: t('dir.police'), number: '999' },
    { key: 'dir.women_child', label: t('dir.women_child'), number: '109' },
    { key: 'dir.child', label: t('dir.child'), number: '1098' },
    { key: 'dir.disaster', label: t('dir.disaster'), number: '1090' },
  ];

  const call = (number: string) => Linking.openURL(`tel:${number}`);

  return (
    <View style={styles.container}>
      <FlatList
        data={numbers}
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
    minHeight: 64,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { fontSize: 16, color: '#111827', flex: 1, marginRight: 12 },
  number: { fontSize: 24, fontWeight: 'bold', color: '#6B21A8' },
});