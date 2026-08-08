import { apiRequest } from '../api/client';

// 1. Define what constitutes a "danger" and our thresholds
const DANGER_CATEGORIES = ['mugging', 'harassment', 'checkpost_harassment'];
const CHECK_RADIUS_KM = 0.5; // We only care about reports within 500 meters
const REPORT_COUNT_THRESHOLD = 4; // Warn if there are 4+ unverified danger reports
const VERIFIED_COUNT_THRESHOLD = 2; // Warn if there are 2+ VERIFIED danger reports

// 2. Define the shape of the data coming back from the API
export type NearbyReport = {
  id: string;
  category: string;
  lat: number;
  lng: number;
  description: string;
  createdAt: string;
  verifiedCount: number;
};

// 3. The main function that will be called every time the user's location updates
export async function checkRouteDanger(
  lat: number,
  lng: number
): Promise<{ shouldWarn: boolean; reports: NearbyReport[] }> {
  try {
    // Fetch reports within 500m of the user's current coordinates
    const reports: NearbyReport[] = await apiRequest(
      `/reports/nearby?lat=${lat}&lng=${lng}&radius=${CHECK_RADIUS_KM}`
    );
    
    // Filter out non-danger reports like 'poor_lighting' or 'safe_spot'
    const dangerReports = reports.filter((r) => DANGER_CATEGORIES.includes(r.category));
    
    // Count how many of these danger reports have been verified by other users
    const verifiedDangerCount = dangerReports.filter((r) => r.verifiedCount > 0).length;
    
    // Determine if we hit either the raw report threshold (4) or the verified threshold (2)
    const shouldWarn =
      dangerReports.length >= REPORT_COUNT_THRESHOLD || verifiedDangerCount >= VERIFIED_COUNT_THRESHOLD;
      
    return { shouldWarn, reports: dangerReports };
  } catch {
    // If the API fails (e.g., bad network), fail silently so we don't spam the user with errors
    return { shouldWarn: false, reports: [] };
  }
}