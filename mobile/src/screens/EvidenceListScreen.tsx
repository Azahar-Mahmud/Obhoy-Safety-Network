import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Sharing from 'expo-sharing';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { decryptFile } from '../utils/evidenceCrypto';

type Props = NativeStackScreenProps<RootStackParamList, 'EvidenceList'>;

export default function EvidenceListScreen({ route, navigation }: Props) {
  const { justSavedPath } = route.params;

  const handleShare = async () => {
    try {
      const decryptedPath = await decryptFile(justSavedPath);
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(decryptedPath);
      }
    } catch (err) {
      console.error('[EVIDENCE LIST] Decryption error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recording Encrypted & Saved</Text>
      <Text style={styles.subtitle}>Footage is protected using AES encryption on your local device storage.</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleShare}>
        <Text style={styles.buttonText}>Decrypt & Share Recording</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.secondaryButtonText}>Return to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F9FAFB' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 28, textAlign: 'center' },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  secondaryButton: { padding: 12 },
  secondaryButtonText: { color: '#4B5563', fontSize: 15 },
});