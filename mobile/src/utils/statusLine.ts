import * as Battery from 'expo-battery';
import { getLastActive } from './lastActive';

// Helper to format the date into a human-readable "Xm ago" string
function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/** 
 * For Layers 2–4 (SMS, LAN, Mesh), which build their own message text on-device. 
 */
export async function buildStatusLine(): Promise<string> {
  const parts: string[] = [];
  
  const lastActive = await getLastActive();
  if (lastActive) {
    parts.push(`Last active: ${timeAgo(lastActive)}`);
  }
  
  const level = await Battery.getBatteryLevelAsync();
  if (level >= 0) {
    parts.push(`Battery: ${Math.round(level * 100)}%`);
  }
  
  return parts.length ? ` | ${parts.join(', ')}` : '';
}

/** 
 * For Layer 1 (Backend), which sends structured data and lets the backend build the message. 
 */
export async function getStatusPayload(): Promise<{ lastActiveAt: string | null; batteryPercent: number | null }> {
  const lastActive = await getLastActive();
  const level = await Battery.getBatteryLevelAsync();
  
  return {
    lastActiveAt: lastActive ? lastActive.toISOString() : null,
    batteryPercent: level >= 0 ? Math.round(level * 100) : null,
  };
}