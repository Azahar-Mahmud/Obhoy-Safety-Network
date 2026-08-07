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
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      const enabled = (await SecureStore.getItemAsync('obhoy_fall_detection_enabled')) === 'true';
      if (!enabled) return;
      
      const sensitivity = ((await SecureStore.getItemAsync('obhoy_fall_sensitivity')) || 'medium') as Sensitivity;
      
      // If a fall happens, move from 'idle' to 'countdown'
      startFallDetection(sensitivity, () => setPhase('countdown'));
    })();

    return () => stopFallDetection();
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