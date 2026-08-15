import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportCategory'>;

const CATEGORIES = [
  { key: 'mugging', icon: '🚨', color: '#DC2626' },
  { key: 'harassment', icon: '⚠️', color: '#DC2626' },
  { key: 'checkpost_harassment', icon: '🚔', color: '#DC2626' },
  { key: 'poor_lighting', icon: '💡', color: '#D97706' },
  { key: 'safe_spot', icon: '✅', color: '#16A34A' },
] as const;

export default function ReportCategoryScreen({ navigation }: Props) {
  useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('report.pick_category')}</Text>
      <View style={styles.grid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.card, { borderColor: cat.color }]}
            onPress={() => navigation.navigate('ReportConfirm', { category: cat.key })}
          >
            <Text style={styles.icon}>{cat.icon}</Text>
            <Text style={styles.label}>{t(`category.${cat.key}` as any)}</Text>
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
    justifyContent: 'center', alignItems: 'center', marginBottom: 16, backgroundColor: '#fff', minHeight: 100,
  },
  icon: { fontSize: 40, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'center', paddingHorizontal: 8 },
});