import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://obhoy-safety-network.onrender.com';

async function attemptRequest(path: string, options: RequestInit, token: string | null, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = await SecureStore.getItemAsync('obhoy_token');
  try {
    // 1. First attempt: 6 seconds (fast response for warm server)
    return await attemptRequest(path, options, token, 6000);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      // 2. Timed out on first attempt: Render instance is likely waking up from sleep.
      // Retry once with a 45-second window to let it finish booting up.
      return await attemptRequest(path, options, token, 45000);
    }
    // Any other error (offline, DNS error, 4xx/5xx) fails immediately
    throw err;
  }
}