import { apiRequest } from '../api/client';

export async function startEvidenceSession(): Promise<{ id: string; trackingToken: string }> {
  return apiRequest('/evidence/start', { method: 'POST' });
}

export async function pingEvidenceLocation(id: string, lat: number, lng: number): Promise<void> {
  await apiRequest(`/evidence/${id}/location`, { method: 'PATCH', body: JSON.stringify({ lat, lng }) });
}

export async function stopEvidenceSession(id: string): Promise<void> {
  await apiRequest(`/evidence/${id}/stop`, { method: 'PATCH' });
}