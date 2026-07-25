import dgram from 'react-native-udp';
import NetInfo from '@react-native-community/netinfo';
import { acquireMulticastLock, releaseMulticastLock } from '../../modules/lan-multicast/src';

export const LAN_ALERT_PORT = 41999;
const BROADCAST_ADDRESS = '255.255.255.255';
const PACKET_TYPE = 'obhoy_sos';

export type LanAlertPayload = {
  type: string;
  message: string;
  lat: number;
  lng: number;
  sentAt: string;
};

export async function sendLanAlert(lat: number, lng: number, message: string): Promise<boolean> {
  const netState = await NetInfo.fetch();
  console.log('NetInfo state:', JSON.stringify(netState));
  if (netState.type !== 'wifi') {
    return false;
  }

  return new Promise((resolve) => {
    let socket: any;
    try {
      acquireMulticastLock();
      socket = dgram.createSocket({ type: 'udp4' });
    } catch {
      resolve(false);
      return;
    }
    const payload: LanAlertPayload = {
      type: PACKET_TYPE,
      message,
      lat,
      lng,
      sentAt: new Date().toISOString(),
    };
    const data = JSON.stringify(payload);
    let sentOk = false;
    let attempts = 0;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      try {
        socket.close();
      } catch {}
      releaseMulticastLock();
      resolve(sentOk);
    };

    // Safety timeout: Ensure Promise ALWAYS resolves within 3 seconds
    const timeout = setTimeout(() => {
      finish();
    }, 3000);

    socket.on('error', () => {
      clearTimeout(timeout);
      finish();
    });

    const attempt = () => {
      socket.send(data, undefined, undefined, LAN_ALERT_PORT, BROADCAST_ADDRESS, (err: any) => {
        if (!err) sentOk = true;
        attempts += 1;
        if (attempts < 3) {
          setTimeout(attempt, 300);
        } else {
          clearTimeout(timeout);
          finish();
        }
      });
    };

    socket.once('listening', () => {
      try {
        socket.setBroadcast(true);
      } catch {}
      attempt();
    });

    try {
      socket.bind(0);
    } catch {
      clearTimeout(timeout);
      finish();
    }
  });
}

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