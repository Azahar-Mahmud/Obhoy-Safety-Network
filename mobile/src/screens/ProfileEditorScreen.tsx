import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { ScreenHeader, Card, Button, Avatar } from '../components';
import { colors, radii, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileEditor'>;

export default function ProfileEditorScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest('/auth/me')
      .then((data) => {
        if (data.name) setName(data.name);
        if (data.email) setEmail(data.email);
        if (data.phone) setPhone(data.phone);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiRequest('/auth/me', {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      if (res.name) await SecureStore.setItemAsync('obhoy_user_name', res.name);
      Alert.alert('Saved', 'Profile updated successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader title="Edit Profile" subtitle="Update your personal details" />

      <View style={styles.avatarContainer}>
        <Avatar initial={(name || phone || 'U')[0].toUpperCase()} size={80} />
        <Text style={styles.avatarHint}>Photo sync coming soon</Text>
      </View>

      <Card style={styles.card}>
        <Text style={styles.inputLabel}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Tanvir Ahmed"
          placeholderTextColor={colors.textSecondary}
        />

        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={[styles.input, styles.readOnlyInput]}
          value={phone}
          editable={false}
        />
        <Text style={styles.hint}>Phone number cannot be changed.</Text>

        <View style={styles.divider} />

        <Text style={styles.inputLabel}>Email Address (Optional)</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={colors.textSecondary}
        />
      </Card>

      <Button
        label={saving ? "Saving..." : "Save Profile"}
        variant="primary"
        onPress={handleSave}
        disabled={saving || !name.trim()}
        style={styles.btn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  avatarContainer: { alignItems: 'center', marginVertical: spacing.lg },
  avatarHint: { fontSize: 13, color: colors.primary, marginTop: spacing.sm, fontWeight: '600' },
  card: { padding: spacing.lg, marginBottom: spacing.xl },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  readOnlyInput: { backgroundColor: colors.bg, color: colors.textSecondary },
  hint: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  btn: { marginTop: spacing.xs },
});