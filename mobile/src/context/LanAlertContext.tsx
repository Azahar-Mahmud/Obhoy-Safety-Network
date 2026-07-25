import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { startLanAlertListener, stopLanAlertListener, LanAlertPayload } from '../utils/lanAlert';

// Configure foreground notification banners
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type ReceivedAlert = LanAlertPayload & { receivedAt: string };

type LanAlertContextType = {
  alerts: ReceivedAlert[];
};

const LanAlertContext = createContext<LanAlertContextType | undefined>(undefined);
const MAX_ALERTS = 20;

export function LanAlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<ReceivedAlert[]>([]);
  const startedRef = useRef(false);

  const handleAlert = useCallback((payload: LanAlertPayload) => {
    setAlerts((prev) => [{ ...payload, receivedAt: new Date().toISOString() }, ...prev].slice(0, MAX_ALERTS));
    
    Notifications.scheduleNotificationAsync({
      content: { 
        title: 'Nearby Obhoy Alert', 
        body: payload.message || 'Someone nearby may need help.' 
      },
      trigger: null,
    });
  }, []);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startLanAlertListener(handleAlert);
    return () => stopLanAlertListener();
  }, [handleAlert]);

  return <LanAlertContext.Provider value={{ alerts }}>{children}</LanAlertContext.Provider>;
}

export function useLanAlerts() {
  const ctx = useContext(LanAlertContext);
  if (!ctx) throw new Error('useLanAlerts must be used within LanAlertProvider');
  return ctx;
}