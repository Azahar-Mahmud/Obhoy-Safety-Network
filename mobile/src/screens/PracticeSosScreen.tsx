import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';

import { ScreenHeader, Button, Card } from '../components';
import { SosButton } from '../components/SosButton';
import { useSosSimulation } from '../practice/useSosSimulation';
import { colors, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PracticeSos'>;

export default function PracticeSosScreen({ navigation }: Props) {
  const { stage, trigger } = useSosSimulation();

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Practice SOS"
        subtitle="Simulated training — zero network, SMS, or emergency calls fired."
      />

      <View style={styles.centerHero}>
        {stage === 'idle' && (
          <View style={styles.heroBox}>
            <SosButton onTrigger={trigger} />
            <Text style={styles.hintText}>Press and hold for 1 second to trigger</Text>
          </View>
        )}

        {stage === 'simulating' && (
          <View style={styles.heroBox}>
            <ActivityIndicator size="large" color={colors.danger} style={{ marginBottom: 16 }} />
            <Text style={styles.simulatingTitle}>Simulating SOS Sequence…</Text>
            <Text style={styles.simulatingSub}>Testing multi-layer fallback channels</Text>
          </View>
        )}

        {stage === 'done' && (
          <Card style={styles.successCard}>
            <View style={styles.successIconBox}>
              <Feather name="check-circle" size={40} color={colors.safe} />
            </View>
            <Text style={styles.successTitle}>Simulation Complete!</Text>
            <Text style={styles.successBody}>
              That is exactly how the real SOS alert behaves. You can practice this anytime without alarming your contacts.
            </Text>
          </Card>
        )}
      </View>

      <View style={styles.bottomBar}>
        {stage === 'done' && (
          <Button
            label="Done"
            variant="primary"
            onPress={() => navigation.goBack()}
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