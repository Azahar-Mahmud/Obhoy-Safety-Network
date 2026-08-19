import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing, typography } from '../theme/theme';

interface ActiveJourneyBannerProps {
  activeJourney: any;
  onPress?: () => void;
}

export function ActiveJourneyBanner({ activeJourney, onPress }: ActiveJourneyBannerProps) {
  if (!activeJourney) return null;

  const destination = activeJourney.destinationLabel || 'destination';

  return (
    <Pressable 
      onPress={onPress} 
      style={styles.container}
    >
      <View style={styles.row}>
        <View style={styles.pulseDot} />
        <Text style={styles.text} numberOfLines={1}>
          Active Journey to {destination}
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  text: {
    ...typography.body,
    color: colors.primaryDark,
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
});