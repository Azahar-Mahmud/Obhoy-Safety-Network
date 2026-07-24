import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportCategory'>;

const CATEGORIES = [
  { key: 'mugging', label: 'Mugging / Theft', icon: '🚨', color: '#DC2626' },
  { key: 'harassment', label: 'Harassment', icon: '⚠️', color: '#DC2626' },
  { key: 'checkpost_harassment', label: 'Check-post Harassment', icon: '🚔', color: '#DC2626' },
  { key: 'poor_lighting', label: 'Poor Lighting', icon: '💡', color: '#D97706' },
  { key: 'safe_spot', label: 'Safe Spot', icon: '✅', color: '#16A34A' },
];

export default function ReportCategoryScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What happened here?</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.card, { borderColor: cat.color }]}
            onPress={() => navigation.navigate('ReportConfirm', { category: cat.key })}
          >
            <Text style={styles.icon}>{cat.icon}</Text>
            <Text style={styles.label}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 20, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%', aspectRatio: 1, borderWidth: 2, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff',
  },
  icon: { fontSize: 40, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', paddingHorizontal: 8 },
});