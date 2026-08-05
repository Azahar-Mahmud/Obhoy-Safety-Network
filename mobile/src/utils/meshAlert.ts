import * as Crypto from 'expo-crypto';
import {
  startAdvertise,
  stopAdvertise,
  startDiscovery,
  stopDiscovery,
  onPeerFound,
  onInvitationReceived,
  onConnected,
  onDisconnected,
  onTextReceived,
  requestConnection,
  acceptConnection,
  sendText,
  Strategy,
} from 'expo-nearby-connections';

const PACKET_TYPE = 'obhoy_sos';
const MAX_TTL = 5; // Max 5 hops between devices

export type MeshAlertPayload = {
  type: string;
  id: string;
  ttl: number;
  message: string;
  lat: number;
  lng: number;
  sentAt: string;
};

const connectedPeers = new Set<string>();
const seenMessageIds = new Set<string>();
let unsubscribers: Array<() => void> = [];
let started = false;

function floodToPeers(payload: MeshAlertPayload, exceptPeerId?: string) {
  const data = JSON.stringify(payload);
  connectedPeers.forEach((peerId) => {
    if (peerId !== exceptPeerId) {
      sendText(peerId, data).catch(() => {
        connectedPeers.delete(peerId); // stale session — stop counting it as connected
      });
    }
  });
}

export function startMeshNode(onAlert: (payload: MeshAlertPayload) => void): void {
  if (started) return;
  started = true;

  unsubscribers = [
    onPeerFound(({ peerId }) => {
      requestConnection(peerId).catch(() => {});
    }),
    onInvitationReceived(({ peerId }) => {
      // Auto-accept connection without user prompt for zero friction
      acceptConnection(peerId).catch(() => {});
    }),
    onConnected(({ peerId }) => {
      connectedPeers.add(peerId);
    }),
    onDisconnected(({ peerId }) => {
      connectedPeers.delete(peerId);
    }),
    onTextReceived(({ peerId, text }) => {
      try {
        const payload: MeshAlertPayload = JSON.parse(text);
        
        // Ignore non-Obhoy or duplicate messages
        if (payload?.type !== PACKET_TYPE || seenMessageIds.has(payload.id)) return;
        
        seenMessageIds.add(payload.id);
        onAlert(payload);

        // If TTL > 0, relay/forward the message to all OTHER connected peers!
        if (payload.ttl > 0) {
          floodToPeers({ ...payload, ttl: payload.ttl - 1 }, peerId);
        }
      } catch {
        // Ignored if malformed
      }
    }),
  ];

  startAdvertise('Obhoy', Strategy.P2P_CLUSTER).catch(() => {});
  startDiscovery('Obhoy', Strategy.P2P_CLUSTER).catch(() => {});

  // Self-healing: if nothing has connected after 15s, restart the cycle —
  // guards against a one-off stalled discovery instead of staying stuck.
  const healthCheck = setInterval(() => {
    if (!started) {
      clearInterval(healthCheck);
      return;
    }
    if (connectedPeers.size === 0) {
      stopAdvertise().catch(() => {});
      stopDiscovery().catch(() => {});
      startAdvertise('Obhoy', Strategy.P2P_CLUSTER).catch(() => {});
      startDiscovery('Obhoy', Strategy.P2P_CLUSTER).catch(() => {});
    }
  }, 15000);
  unsubscribers.push(() => clearInterval(healthCheck));
}

export function stopMeshNode(): void {
  if (!started) return;
  started = false;
  unsubscribers.forEach((unsub) => unsub());
  unsubscribers = [];
  connectedPeers.clear();
  stopAdvertise().catch(() => {});
  stopDiscovery().catch(() => {});
}

export async function sendMeshAlert(lat: number, lng: number, message: string): Promise<boolean> {
  for (let i = 0; i < 40 && connectedPeers.size === 0; i++) {
    await new Promise((r) => setTimeout(r, 500));
  }

  if (connectedPeers.size === 0) {
    return false;
  }

  const payload: MeshAlertPayload = {
    type: PACKET_TYPE,
    id: Crypto.randomUUID(),
    ttl: MAX_TTL,
    message,
    lat,
    lng,
    sentAt: new Date().toISOString(),
  };

  seenMessageIds.add(payload.id);
  floodToPeers(payload);
  return true;
}