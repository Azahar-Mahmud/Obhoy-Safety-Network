import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

interface ActiveJourneyBannerProps {
  activeJourney: any;
  onPress?: () => void;
}

export function ActiveJourneyBanner({ activeJourney, onPress }: ActiveJourneyBannerProps) {
  if (!activeJourney) return null;

  return (
    <Pressable style={styles.banner} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.pulseDot} />
        <Text style={styles.bannerText}>Journey Active</Text>
      </View>
      <Text style={styles.bannerTime}>00:00</Text> {/* Wire this to real timer context later */}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  bannerText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
  bannerTime: { color: '#fff', fontSize: 13.5, fontWeight: '600', opacity: 0.9 },
  pulseDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginRight: 8,
  }
});