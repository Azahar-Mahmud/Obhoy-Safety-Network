import React, { useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';

import { ScreenHeader, Button, Card, SosButton } from '../components';
import { useSosSimulation } from '../practice/useSosSimulation';
import { colors, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PracticeSos'>;

export default function PracticeSosScreen({ navigation }: Props) {
  const { stage, trigger } = useSosSimulation();

  return (
    <View style={styles.container}>
      <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
        <ScreenHeader
          title="Practice SOS"
          subtitle="Simulated training — zero network, SMS, or emergency calls fired."
        />
      </View>

      <View style={styles.centerHero}>
        {stage === 'idle' && (
          <View style={styles.heroBox}>
            <View style={styles.sosRingOuter}>
              <SosButton onTrigger={trigger} />
            </View>
            <Text style={styles.hintText}>Press and hold for 1.5 seconds to trigger</Text>
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
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'space-between' },
  centerHero: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  heroBox: { alignItems: 'center' },
  sosRingOuter: {
    width: 172, height: 172, borderRadius: 86,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.dangerTint,
    marginBottom: 12
  },
  hintText: { ...typography.hint, marginTop: spacing.sm, fontSize: 14, fontWeight: '600' },
  simulatingTitle: { ...typography.sectionHeading, fontSize: 18, color: colors.text, marginBottom: 4 },
  simulatingSub: { ...typography.hint, fontSize: 14, textAlign: 'center' },
  successCard: { alignItems: 'center', padding: spacing.xl, width: '100%' },
  successIconBox: { marginBottom: spacing.md },
  successTitle: { ...typography.sectionHeading, color: colors.safe, fontSize: 20, marginBottom: 8 },
  successBody: { ...typography.hint, textAlign: 'center', lineHeight: 22, fontSize: 14 },
  bottomBar: { paddingVertical: spacing.md, paddingHorizontal: spacing.xl },
});