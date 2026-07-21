import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'https://obhoy-safety-network.onrender.com'; // ← Your active Render URL

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = await SecureStore.getItemAsync('obhoy_token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
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
}