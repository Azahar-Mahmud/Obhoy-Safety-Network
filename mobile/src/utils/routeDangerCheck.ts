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
    // --- STEP 4: Fetch historical reports AND live community alerts in parallel ---
    const [reports, alerts]: [NearbyReport[], unknown[]] = await Promise.all([
      apiRequest(`/reports/nearby?lat=${lat}&lng=${lng}&radius=${CHECK_RADIUS_KM}`),
      apiRequest(`/community-alerts/nearby?lat=${lat}&lng=${lng}&radius=${CHECK_RADIUS_KM}`),
    ]);

    const dangerReports = reports.filter((r) => DANGER_CATEGORIES.includes(r.category));
    const verifiedDangerCount = dangerReports.filter((r) => r.verifiedCount > 0).length;
    
    // Even ONE live community alert in the last 45 mins triggers a route warning
    const hasLiveAlert = alerts.length > 0;
    
    const shouldWarn =
      hasLiveAlert ||
      dangerReports.length >= REPORT_COUNT_THRESHOLD ||
      verifiedDangerCount >= VERIFIED_COUNT_THRESHOLD;
      
    return { shouldWarn, reports: dangerReports };
  } catch {
    return { shouldWarn: false, reports: [] };
  }
}