const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API_KEY;
const ORS_TIMEOUT_MS = 5000;

export interface RoutePoint {
  lat: number;
  lng: number;
}

export async function getRoute(from: RoutePoint, to: RoutePoint): Promise<RoutePoint[]> {
  // If either point is missing, return empty
  if (!from || !to || typeof from.lat !== 'number' || typeof to.lat !== 'number') {
    return [];
  }

  // If no ORS key is configured, return straight-line fallback immediately
  if (!ORS_API_KEY) {
    return [from, to];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ORS_TIMEOUT_MS);

    // Note: ORS expects "lng,lat" order in the query parameters
    const url = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${ORS_API_KEY}&start=${from.lng},${from.lat}&end=${to.lng},${to.lat}`;
    
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error('ORS request failed');
    
    const data = await response.json();
    const coords = data.features?.[0]?.geometry?.coordinates;
    
    if (!coords || coords.length < 2) throw new Error('No usable route returned');

    // Convert back from ORS [lng, lat] to standard { lat, lng }
    return coords.map(([lng, lat]: [number, number]) => ({ lat, lng }));
  } catch (err) {
    // Timeout, network error, quota exceeded, or no road data -> Graceful straight-line fallback
    console.log('[ROUTING] Using straight-line fallback:', (err as Error)?.message || err);
    return [from, to];
  }
}