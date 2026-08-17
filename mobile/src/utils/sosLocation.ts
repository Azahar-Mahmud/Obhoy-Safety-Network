import * as Location from 'expo-location';

export async function getSosLocation(onUpdate: (loc: Location.LocationObject) => void) {
  // 1. Get cached last-known position immediately — never blocks emergency sending
  try {
    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown) {
      onUpdate(lastKnown);
    }
  } catch {}

  // 2. Request a fresh fix in parallel with Balanced accuracy
  try {
    const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    if (fresh) {
      onUpdate(fresh);
    }
  } catch {
    // If fresh fix fails or is slow, the lastKnown fix already went out above
  }
}