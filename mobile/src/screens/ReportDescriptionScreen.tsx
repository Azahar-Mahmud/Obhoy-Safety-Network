import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportDescription'>;

export default function ReportDescriptionScreen({ route, navigation }: Props) {
  useLanguage();
  const { category, lat, lng } = route.params;
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    try {
      await apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify({ category, lat, lng, description }),
      });
      navigation.navigate('ReportSuccess');
    } catch (err: any) {
      setError(err.message || t('common.error'));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('report.description')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('report.description')}
        value={description}
        onChangeText={setDescription}
        multiline
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={submit}>
        <Text style={styles.buttonText}>{t('common.confirm')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.skipButton} onPress={submit}>
        <Text style={styles.skipText}>{t('common.skip')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#6B7280', borderRadius: 8, padding: 14, fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, minHeight: 52, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  skipButton: { marginTop: 12, alignItems: 'center', padding: 8 },
  skipText: { color: '#6B7280', fontSize: 15 },
  error: { color: '#DC2626', marginBottom: 12 },
});