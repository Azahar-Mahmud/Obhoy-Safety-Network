import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportSuccess'>;

export default function ReportSuccessScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.checkmark}>✓</Text>
      <Text style={styles.title}>Report Submitted</Text>
      <Text style={styles.subtitle}>Thanks — this helps keep the map accurate for everyone.</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Map')}>
        <Text style={styles.buttonText}>Back to Map</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  checkmark: { fontSize: 64, color: '#16A34A' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginTop: 12 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 32 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, paddingHorizontal: 32, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});