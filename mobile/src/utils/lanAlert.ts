import dgram from 'react-native-udp';
import NetInfo from '@react-native-community/netinfo';
import { acquireMulticastLock, releaseMulticastLock, sendUdpBroadcast } from '../../modules/lan-multicast/src';

export const LAN_ALERT_PORT = 41999;
const PACKET_TYPE = 'obhoy_sos';

export type LanAlertPayload = {
  type: string;
  message: string;
  lat: number;
  lng: number;
  sentAt: string;
};

export async function sendLanAlert(lat: number, lng: number, message: string): Promise<boolean> {
  const netState: any = await NetInfo.fetch();
  if (netState.type !== 'wifi') {
    return false;
  }

  const payload: LanAlertPayload = {
    type: PACKET_TYPE,
    message,
    lat,
    lng,
    sentAt: new Date().toISOString(),
  };
  const data = JSON.stringify(payload);

  try {
    acquireMulticastLock();
    let lastResult = '';
    for (let i = 0; i < 3; i++) {
      lastResult = sendUdpBroadcast(LAN_ALERT_PORT, data);
      if (lastResult === 'sent') break;
      await new Promise((r) => setTimeout(r, 300));
    }
    releaseMulticastLock();
    return lastResult === 'sent';
  } catch {
    releaseMulticastLock();
    return false;
  }
}

// Listening still goes through react-native-udp/dgram below — only the send path
// was replaced with the native module. bind()/on('message') here has always worked.

let listenSocket: any = null;

export function startLanAlertListener(onAlert: (payload: LanAlertPayload) => void): void {
  if (listenSocket) return;
  acquireMulticastLock();
  
  const socket: any = dgram.createSocket({ type: 'udp4' });

  socket.on('error', () => {
    try { socket.close(); } catch {}
    listenSocket = null;
    releaseMulticastLock();
  });

  socket.once('listening', () => {
    try {
      socket.setBroadcast(true);
    } catch {}
  });

  socket.on('message', (msg: any) => {
    try {
      const payload = JSON.parse(msg.toString());
      if (payload && payload.type === PACKET_TYPE) {
        onAlert(payload);
      }
    } catch {
      // Ignore non-Obhoy or malformed datagrams silently
    }
  });

  socket.bind(LAN_ALERT_PORT);
  listenSocket = socket;
}

export function stopLanAlertListener(): void {
  if (listenSocket) {
    try {
      listenSocket.close();
    } catch {}
    listenSocket = null;
    releaseMulticastLock();
  }
}