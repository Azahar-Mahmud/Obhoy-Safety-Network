import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

interface SimpleModeContextValue {
  simpleMode: boolean;
  toggleSimpleMode: () => void;
}

const SimpleModeContext = createContext<SimpleModeContextValue | undefined>(undefined);
const SIMPLE_MODE_KEY = 'obhoy_simple_mode';

export function SimpleModeProvider({ children }: { children: ReactNode }) {
  const [simpleMode, setSimpleMode] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(SIMPLE_MODE_KEY)
      .then((val) => {
        if (val !== null) setSimpleMode(val === 'true');
      })
      .catch(() => {});
  }, []);

  const toggleSimpleMode = async () => {
    const next = !simpleMode;
    setSimpleMode(next);
    await SecureStore.setItemAsync(SIMPLE_MODE_KEY, String(next)).catch(() => {});
  };

  return (
    <SimpleModeContext.Provider value={{ simpleMode, toggleSimpleMode }}>
      {children}
    </SimpleModeContext.Provider>
  );
}

export function useSimpleMode() {
  const ctx = useContext(SimpleModeContext);
  if (!ctx) throw new Error('useSimpleMode must be used within SimpleModeProvider');
  return ctx;
}