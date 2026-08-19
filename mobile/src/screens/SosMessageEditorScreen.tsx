import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ScreenHeader, Card, Button } from '../components';
import { colors, radii, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SosMessageEditor'>;

const MESSAGE_KEY = 'obhoy_custom_sos_message';
const DEFAULT_MESSAGE = "I am in an emergency and need immediate help.";

export default function SosMessageEditorScreen({ navigation }: Props) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(MESSAGE_KEY)
      .then((val) => {
        setMessage(val || DEFAULT_MESSAGE);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const finalMessage = message.trim() || DEFAULT_MESSAGE;
      await SecureStore.setItemAsync(MESSAGE_KEY, finalMessage);
      Alert.alert('Saved', 'Custom SOS message updated successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save message.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMessage(DEFAULT_MESSAGE);
  };

  if (loading) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader 
        title="SOS Message Editor" 
        subtitle="Customize the text sent to your contacts during an emergency." 
      />

      <Card style={styles.card}>
        <Text style={styles.inputLabel}>Emergency Text</Text>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder={DEFAULT_MESSAGE}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={120}
        />
        <Text style={styles.charCount}>{message.length}/120 characters</Text>

        <View style={styles.previewBox}>
          <Text style={styles.previewTitle}>Live Preview (What contacts receive):</Text>
          <Text style={styles.previewText}>
            [Obhoy SOS - 10:42 PM, Aug 19]{'\n'}
            {message.trim() || DEFAULT_MESSAGE}{'\n\n'}
            Live tracking: https://obhoy...
          </Text>
        </View>

        <Button
          label="Reset to Default"
          variant="outline"
          onPress={handleReset}
          style={{ marginBottom: spacing.md }}
        />

        <Button
          label={saving ? "Saving..." : "Save Custom Message"}
          variant="primary"
          onPress={handleSave}
          disabled={saving || message.trim() === ''}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: { padding: spacing.lg },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: { fontSize: 12, color: colors.textSecondary, textAlign: 'right', marginTop: 4, marginBottom: spacing.md },
  previewBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radii.sm,
    marginBottom: spacing.lg,
  },
  previewTitle: { fontSize: 12, fontWeight: '700', color: colors.primary, marginBottom: 6 },
  previewText: { fontSize: 14, color: colors.textPrimary, fontStyle: 'italic', lineHeight: 20 },
});