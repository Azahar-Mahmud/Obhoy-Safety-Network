import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://obhoy-safety-network.onrender.com'; // ← Your active Render URL

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = await SecureStore.getItemAsync('obhoy_token');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
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