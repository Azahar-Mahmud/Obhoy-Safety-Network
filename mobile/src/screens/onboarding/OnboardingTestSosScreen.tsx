import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../../navigation/AppNavigator';

import { ScreenHeader, Button, Card } from '../../components';
import { SosButton } from '../../components/SosButton';
import { colors, spacing, typography } from '../../theme/theme';
import { useLanguage } from '../../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'OnboardingTestSos'>;

export default function OnboardingTestSosScreen({ navigation }: Props) {
  useLanguage();
  const [stage, setStage] = useState<'ready' | 'simulating' | 'done'>('ready');

  const runSimulation = () => {
    setStage('simulating');
    // Timed simulated sequence — zero real network/SMS calls fired
    setTimeout(() => {
      setStage('done');
    }, 2200);
  };

  const handleFinishOnboarding = async () => {
    await SecureStore.setItemAsync('obhoy_onboarding_completed', 'true');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Practice Run"
        subtitle="Try sending an alert safely. Nothing will actually be sent."
      />

      <View style={styles.centerHero}>
        {stage === 'ready' && (
          <View style={styles.heroBox}>
            <SosButton onTrigger={runSimulation} />
            <Text style={styles.hintText}>Press and hold for 1 second to trigger</Text>
          </View>
        )}

        {stage === 'simulating' && (
          <View style={styles.heroBox}>
            <ActivityIndicator size="large" color={colors.danger} style={{ marginBottom: 16 }} />
            <Text style={styles.simulatingTitle}>Simulating Emergency Sequence…</Text>
            <Text style={styles.simulatingSub}>Testing multi-layer redundancy (Simulation only)</Text>
          </View>
        )}

        {stage === 'done' && (
          <Card style={styles.successCard}>
            <View style={styles.successIconBox}>
              <Feather name="check-circle" size={40} color={colors.safe} />
            </View>
            <Text style={styles.successTitle}>Practice Complete!</Text>
            <Text style={styles.successBody}>
              That is exactly how an emergency alert works in real life. Your setup is now ready to protect you.
            </Text>
          </Card>
        )}
      </View>

      <View style={styles.bottomBar}>
        {stage === 'done' && (
          <Button
            label="Got it, Take Me Home"
            variant="primary"
            onPress={handleFinishOnboarding}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA', padding: spacing.lg, justifyContent: 'space-between' },
  centerHero: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroBox: { alignItems: 'center' },
  hintText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.lg, fontSize: 14, fontWeight: '500' },
  simulatingTitle: { ...typography.sectionHeading, fontSize: 18, color: colors.textPrimary, marginBottom: 4 },
  simulatingSub: { ...typography.body, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  successCard: { alignItems: 'center', padding: spacing.xl, width: '100%' },
  successIconBox: { marginBottom: spacing.md },
  successTitle: { ...typography.sectionHeading, color: colors.safe, fontSize: 20, marginBottom: 8 },
  successBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  bottomBar: { paddingVertical: spacing.md },
});