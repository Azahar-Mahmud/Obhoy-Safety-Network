import * as Location from 'expo-location';
import * as Battery from 'expo-battery';
import { apiRequest } from '../api/client';

export type FamilyMember = {
  userId: string;
  phone: string;
  sharingPaused: boolean;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  batteryLevel: number | null;
  lastPublishedAt: string | null;
  sosActive: boolean;
};

export type FamilyState = {
  members: FamilyMember[];
  invites: { id: string; fromPhone: string }[];
  me: { sharingPaused: boolean; refreshRequested: boolean; liveUntil: string | null };
  linkLimit: number;
};

/**
 * Publishes a position we ALREADY HAVE. Costs no GPS.
 * Every rung of the freshness ladder that piggybacks on another
 * feature's fix should call this one, not publishLocation().
 */
export async function publishKnownLocation(
  lat: number,
  lng: number,
  accuracy?: number | null
): Promise<void> {
  try {
    let batteryLevel: number | null = null;
    try {
      const level = await Battery.getBatteryLevelAsync();
      if (level >= 0) batteryLevel = Math.round(level * 100);
    } catch {
      // battery is a nice-to-have, never a reason to skip the publish
    }
    await apiRequest('/family/location', {
      method: 'POST',
      body: JSON.stringify({ lat, lng, accuracy: accuracy ?? null, batteryLevel }),
    });
  } catch {
    // Fire-and-forget by design. A failed publish must never surface
    // an error inside SOS, Journey, or a background task.
  }
}

/**
 * Takes a fresh fix and publishes it. This is the only function here
 * that costs battery, so it has exactly three callers:
 * the periodic background task, the app-foreground handler, and
 * the Family screen's own live loop.
 */
export async function publishLocation(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted') return false;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    await publishKnownLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
    return true;
  } catch {
    return false;
  }
}

export async function fetchFamilyState(opened = false): Promise<FamilyState> {
  return apiRequest(`/family/state${opened ? '?opened=1' : ''}`);
}

export async function pingMember(userId: string): Promise<void> {
  await apiRequest(`/family/ping/${userId}`, { method: 'POST' });
}

export async function setSharingPaused(paused: boolean): Promise<void> {
  await apiRequest('/family/sharing', {
    method: 'PATCH',
    body: JSON.stringify({ paused }),
  });
}

export async function setLiveDuration(minutes: number): Promise<void> {
  await apiRequest('/family/live', {
    method: 'PATCH',
    body: JSON.stringify({ minutes }),
  });
}

export async function inviteByPhone(phone: string) {
  return apiRequest('/family/invite', { method: 'POST', body: JSON.stringify({ phone }) });
}

export async function respondToInvite(id: string, accept: boolean) {
  return apiRequest(`/family/invite/${id}/respond`, {
    method: 'POST',
    body: JSON.stringify({ accept }),
  });
}

export async function unlinkMember(userId: string) {
  return apiRequest(`/family/link/${userId}`, { method: 'DELETE' });
}

export async function fetchViewers() {
  return apiRequest('/family/viewers');
}