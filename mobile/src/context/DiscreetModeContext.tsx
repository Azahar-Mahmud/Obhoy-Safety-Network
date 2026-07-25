import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { enableDisguise, disableDisguise } from '../../modules/discreet-toggle/src/index';
import { verifyLocalPin } from '../utils/localPin';

const DISCREET_ENABLED_KEY = 'obhoy_discreet_enabled';

type DiscreetModeContextType = {
  discreetModeEnabled: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
};

const DiscreetModeContext = createContext<DiscreetModeContextType | undefined>(undefined);

export function DiscreetModeProvider({ children }: { children: React.ReactNode }) {
  const [discreetModeEnabled, setDiscreetModeEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync(DISCREET_ENABLED_KEY).then((stored) => {
      setDiscreetModeEnabled(stored === 'true');
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    Notifications.setNotificationChannelAsync('checkin-default', {
      name: 'Check-in reminders',
      importance: Notifications.AndroidImportance.HIGH,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
    Notifications.setNotificationChannelAsync('checkin-discreet', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }, []);

  const enable = useCallback(async () => {
    enableDisguise();
    await SecureStore.setItemAsync(DISCREET_ENABLED_KEY, 'true');
    setDiscreetModeEnabled(true);
  }, []);

  const disable = useCallback(async () => {
    disableDisguise();
    await SecureStore.setItemAsync(DISCREET_ENABLED_KEY, 'false');
    setDiscreetModeEnabled(false);
  }, []);

  const unlock = useCallback(async (pin: string) => {
    const ok = await verifyLocalPin(pin);
    if (ok) setIsUnlocked(true);
    return ok;
  }, []);

  const lock = useCallback(() => setIsUnlocked(false), []);

  return (
    <DiscreetModeContext.Provider value={{ discreetModeEnabled, isUnlocked, isLoading, enable, disable, unlock, lock }}>
      {children}
    </DiscreetModeContext.Provider>
  );
}

export function useDiscreetMode() {
  const ctx = useContext(DiscreetModeContext);
  if (!ctx) throw new Error('useDiscreetMode must be used within Provider');
  return ctx;
}