import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { startFallDetection, stopFallDetection, Sensitivity } from '../utils/fallDetection';

type Phase = 'idle' | 'countdown' | 'card';

type FallDetectionContextType = {
  phase: Phase;
  resolveCountdown: () => void;
  escalateToCard: () => void;
  dismissCard: () => void;
};

const FallDetectionContext = createContext<FallDetectionContextType | undefined>(undefined);

export function FallDetectionProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>('idle');
  
  // Track the current active configuration
  const configRef = useRef({ enabled: false, sensitivity: '' });

  useEffect(() => {
    const triggerFall = () => setPhase('countdown');

    const syncSettings = async () => {
      try {
        const enabledStr = await SecureStore.getItemAsync('obhoy_fall_detection_enabled');
        const sensStr = (await SecureStore.getItemAsync('obhoy_fall_sensitivity')) || 'medium';
        const isEnabled = enabledStr === 'true';

        // If nothing changed, do nothing
        if (configRef.current.enabled === isEnabled && configRef.current.sensitivity === sensStr) {
          return;
        }

        // Settings changed! Stop the old listener and start the new one
        stopFallDetection();

        if (isEnabled) {
          startFallDetection(sensStr as Sensitivity, triggerFall);
          console.log(`[FALL DETECT] Armed. Sensitivity: ${sensStr}`);
        } else {
          console.log('[FALL DETECT] Disarmed.');
        }

        configRef.current = { enabled: isEnabled, sensitivity: sensStr };
      } catch (err) {}
    };

    // 1. Check immediately on boot
    syncSettings();

    // 2. Poll every 2.5 seconds to instantly catch any toggles flipped in SettingsScreen
    const interval = setInterval(syncSettings, 2500);

    return () => {
      clearInterval(interval);
      stopFallDetection();
    };
  }, []);

  return (
    <FallDetectionContext.Provider
      value={{
        phase,
        resolveCountdown: () => setPhase('idle'),
        escalateToCard: () => setPhase('card'),
        dismissCard: () => setPhase('idle'),
      }}
    >
      {children}
    </FallDetectionContext.Provider>
  );
}

export function useFallDetection() {
  const ctx = useContext(FallDetectionContext);
  if (!ctx) throw new Error('useFallDetection must be used within FallDetectionProvider');
  return ctx;
}