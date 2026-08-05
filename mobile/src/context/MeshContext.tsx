import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { startMeshNode, stopMeshNode, MeshAlertPayload } from '../utils/meshAlert';

export type ReceivedMeshAlert = MeshAlertPayload & { receivedAt: string };

type MeshContextType = {
  meshAlerts: ReceivedMeshAlert[];
};

const MeshContext = createContext<MeshContextType | undefined>(undefined);
const MAX_ALERTS = 20;

async function ensureMeshPermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  // BLUETOOTH_SCAN/ADVERTISE/CONNECT and NEARBY_WIFI_DEVICES only exist from Android 12 (API 31)
  // onward. Below that, ACCESS_FINE_LOCATION is the one permission Bluetooth scanning needs.
  const permissions =
    Platform.Version >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.NEARBY_WIFI_DEVICES,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const granted = await PermissionsAndroid.requestMultiple(permissions);
  return Object.values(granted).every((status) => status === PermissionsAndroid.RESULTS.GRANTED);
}

export function MeshProvider({ children }: { children: React.ReactNode }) {
  const [meshAlerts, setMeshAlerts] = useState<ReceivedMeshAlert[]>([]);
  const startedRef = useRef(false);

  const handleAlert = useCallback((payload: MeshAlertPayload) => {
    setMeshAlerts((prev) => [{ ...payload, receivedAt: new Date().toISOString() }, ...prev].slice(0, MAX_ALERTS));
    const preview = String(payload.message || '').slice(0, 120);
    
    Notifications.scheduleNotificationAsync({
      content: { 
        title: 'Nearby Obhoy Alert', 
        body: preview || 'Someone nearby may need help.' 
      },
      trigger: null,
    });
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    
    ensureMeshPermissions().then((granted) => {
      if (granted) startMeshNode(handleAlert);
    });
    
    return () => stopMeshNode();
  }, [handleAlert]);

  return <MeshContext.Provider value={{ meshAlerts }}>{children}</MeshContext.Provider>;
}

export function useMesh() {
  const ctx = useContext(MeshContext);
  if (!ctx) throw new Error('useMesh must be used within MeshProvider');
  return ctx;
}