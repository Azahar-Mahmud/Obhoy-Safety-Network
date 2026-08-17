import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

import { ScreenHeader, Button, Card } from '../components';
import { colors, spacing, typography } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PracticeCheckin'>;

export default function PracticeCheckinScreen({ navigation }: Props) {
  const [answered, setAnswered] = useState<'yes' | 'no' | null>(null);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Practice Check-in"
        subtitle="Learn what happens during a Journey Mode check-in"
      />

      <View style={styles.centerContent}>
        {!answered && (
          <Card style={styles.promptCard}>
            <Text style={styles.promptTitle}>Are you okay?</Text>
            <Text style={styles.promptSubtitle}>
              During an active journey, Obhoy prompts you at your chosen interval.
            </Text>

            <Button
              label="I'm Safe, Keep Going"
              variant="safe"
              onPress={() => setAnswered('yes')}
              style={styles.btn}
            />
            <Button
              label="No, I Need Help"
              variant="danger"
              onPress={() => setAnswered('no')}
              style={styles.btn}
            />
          </Card>
        )}

        {answered === 'yes' && (
          <Card style={styles.resultCard}>
            <Text style={[styles.resultTitle, { color: colors.safe }]}>✓ Safe Confirmation</Text>
            <Text style={styles.resultBody}>
              In a real journey, tapping "I'm Safe" quietly resets your timer for the next interval and logs your safety. No contacts are alarmed.
            </Text>
          </Card>
        )}

        {answered === 'no' && (
          <Card style={styles.resultCard}>
            <Text style={[styles.resultTitle, { color: colors.danger }]}>⚠️ Emergency Escalation</Text>
            <Text style={styles.resultBody}>
              In a real journey, tapping "I Need Help" immediately escalates to your emergency contacts with an urgent SMS alert and live map link.
            </Text>
          </Card>
        )}
      </View>

      <View style={styles.bottomBar}>
        {answered && (
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
  centerContent: { flex: 1, justifyContent: 'center' },
  promptCard: { padding: spacing.xl },
  promptTitle: { ...typography.sectionHeading, fontSize: 22, color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  promptSubtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
  btn: { marginBottom: spacing.md },
  resultCard: { padding: spacing.xl, alignItems: 'center' },
  resultTitle: { ...typography.sectionHeading, fontSize: 20, marginBottom: 12 },
  resultBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  bottomBar: { paddingVertical: spacing.md },
});