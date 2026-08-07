import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSilentModeEnabled, setSilentModeEnabled as persistSilentMode } from '../utils/silentMode';

type SilentModeContextType = {
  silentModeEnabled: boolean;
  loading: boolean;
  setSilentMode: (enabled: boolean) => Promise<void>;
};

const SilentModeContext = createContext<SilentModeContextType>({
  silentModeEnabled: false,
  loading: true,
  setSilentMode: async () => {},
});

export function SilentModeProvider({ children }: { children: ReactNode }) {
  const [silentModeEnabled, setSilentModeEnabledState] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSilentModeEnabled()
      .then(setSilentModeEnabledState)
      .finally(() => setLoading(false));
  }, []);

  const setSilentMode = useCallback(async (enabled: boolean) => {
    await persistSilentMode(enabled);
    setSilentModeEnabledState(enabled);
  }, []);

  return (
    <SilentModeContext.Provider value={{ silentModeEnabled, loading, setSilentMode }}>
      {children}
    </SilentModeContext.Provider>
  );
}

export function useSilentMode() {
  return useContext(SilentModeContext);
}