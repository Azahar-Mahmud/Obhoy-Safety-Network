import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';

import { ScreenHeader, Card, ListRow } from '../components';
import { colors, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'PracticeMode'>;

export default function PracticeModeScreen({ navigation }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title="Practice Mode"
        subtitle="Test critical emergency flows safely or review the app walkthrough."
      />

      <Card>
        <ListRow
          title="Practice sending an SOS"
          subtitle="Feel the real 1s hold gesture and alert sequence"
          left={<Feather name="shield" size={24} color={colors.danger} style={styles.icon} />}
          right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
          onPress={() => navigation.navigate('PracticeSos')}
        />
        
        <View style={styles.divider} />
        
        <ListRow
          title="Practice a Journey Check-in"
          subtitle='Experience the "Are you okay?" prompt and consequences'
          left={<Feather name="navigation" size={24} color={colors.primary} style={styles.icon} />}
          right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
          onPress={() => navigation.navigate('PracticeCheckin')}
        />
        
        <View style={styles.divider} />
        
        {/* New Replay Row */}
        <ListRow
          title="Watch the app tour again"
          subtitle="The 5-slide visual walkthrough shown at first launch"
          left={<Feather name="play-circle" size={24} color={colors.caution} style={styles.icon} />}
          right={<Feather name="chevron-right" size={18} color={colors.textSecondary} />}
          onPress={() => navigation.navigate('OnboardingSlider', { mode: 'replay' })}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  icon: { marginRight: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
});