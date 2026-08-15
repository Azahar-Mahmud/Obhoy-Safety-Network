import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportSuccess'>;

export default function ReportSuccessScreen({ navigation }: Props) {
  useLanguage();

  return (
    <View style={styles.container}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.title}>{t('report.submitted')}</Text>
      <Text style={styles.subtitle}>{t('report.submitted')}</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Map')}>
        <Text style={styles.buttonText}>{t('common.back')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  checkmark: { fontSize: 64, color: '#16A34A' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginTop: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, paddingHorizontal: 32, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});