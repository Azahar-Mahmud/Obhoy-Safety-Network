import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/AppNavigator';

import { ScreenHeader, Button, Card } from '../../components';
import { colors, spacing, typography } from '../../theme/theme';
import { ensureSmsPermission } from '../../utils/sos';
import { useLanguage } from '../../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingPermissions'>;

export default function OnboardingPermissionsScreen({ navigation }: Props) {
  useLanguage();
  const [requesting, setRequesting] = useState(false);

  const handleAllowPermissions = async () => {
    setRequesting(true);
    try {
      await Location.requestForegroundPermissionsAsync();
      await ensureSmsPermission();
    } catch (e) {
      console.warn('[PERMISSIONS] Prime error:', e);
    } finally {
      setRequesting(false);
      // Navigate to the choice screen
      navigation.navigate('OnboardingChoice');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Essential Permissions"
        subtitle="Obhoy needs these two permissions to deliver emergency signals during a crisis."
      />

      <Card style={styles.permCard}>
        <View style={styles.iconCircle}>
          <Feather name="map-pin" size={24} color={colors.primary} />
        </View>
        <View style={styles.permContent}>
          <Text style={styles.permTitle}>Precise Location</Text>
          <Text style={styles.permBody}>
            Allows Obhoy to attach your coordinates to emergency SMS alerts and live tracking maps.
          </Text>
        </View>
      </Card>

      <Card style={styles.permCard}>
        <View style={styles.iconCircle}>
          <Feather name="message-square" size={24} color={colors.primary} />
        </View>
        <View style={styles.permContent}>
          <Text style={styles.permTitle}>Direct Cellular SMS</Text>
          <Text style={styles.permBody}>
            Enables sending emergency alerts directly through your SIM card even when internet connectivity is down.
          </Text>
        </View>
      </Card>

      <View style={styles.buttonGroup}>
        <Button
          label={requesting ? 'Granting...' : 'Allow & Continue'}
          variant="primary"
          onPress={handleAllowPermissions}
          disabled={requesting}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  permCard: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.lg, marginBottom: spacing.md },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  permContent: { flex: 1 },
  permTitle: { ...typography.sectionHeading, fontSize: 16, color: colors.textPrimary, marginBottom: 4 },
  permBody: { ...typography.body, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  buttonGroup: { marginTop: 'auto', paddingTop: spacing.lg },
});