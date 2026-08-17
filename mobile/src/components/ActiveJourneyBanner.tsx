import React from 'react';
import { Pressable } from 'react-native';
import { Banner } from './Banner';

interface ActiveJourneyBannerProps {
  activeJourney: any;
  onPress?: () => void;
}

export function ActiveJourneyBanner({ activeJourney, onPress }: ActiveJourneyBannerProps) {
  if (!activeJourney) return null;

  const destination = activeJourney.destinationLabel || 'destination';
  return (
    <Pressable onPress={onPress}>
      <Banner label={`Active Journey to ${destination} — tap to view`} tone="primary" />
    </Pressable>
  );
}