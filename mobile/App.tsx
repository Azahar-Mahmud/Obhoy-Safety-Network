import './src/polyfills';
import React, { useEffect, useState, createContext } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { recordLastActive } from './src/utils/lastActive';
import { loadLanguage } from './src/i18n';
import { publishLocation } from './src/utils/familyLocation'; // <--- ADDED for Obhoy_31 Rung 1

import { SilentModeProvider } from './src/context/SilentModeContext';
import { FallDetectionProvider } from './src/context/FallDetectionContext';
import { AuthProvider } from './src/context/AuthContext';
import { DiscreetModeProvider } from './src/context/DiscreetModeContext';
import { LanAlertProvider } from './src/context/LanAlertContext';
import { MeshProvider } from './src/context/MeshContext';
import AppNavigator from './src/navigation/AppNavigator';

export const LanguageChosenContext = createContext<{
  chosen: boolean;
  markChosen: () => void;
}>({ chosen: false, markChosen: () => {} });

export default function App() {
  const [languageReady, setLanguageReady] = useState(false);
  const [languageChosen, setLanguageChosen] = useState<boolean>(false);

  useEffect(() => {
    loadLanguage().then((lang) => {
      setLanguageChosen(lang !== null);
      setLanguageReady(true);
    });
  }, []);

  // === TRACK LAST ACTIVE TIME & OPPORTUNISTIC LOCATION PUBLISH ===
  useEffect(() => {
    recordLastActive();
    publishLocation(); // Rung 1 initial
    
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        recordLastActive();
        publishLocation(); // Rung 1 on foreground transition
      }
    });
    
    return () => subscription.remove();
  }, []);
  // ===============================================================

  if (!languageReady) return null;

  return (
    <LanguageChosenContext.Provider
      value={{
        chosen: languageChosen,
        markChosen: () => setLanguageChosen(true),
      }}
    >
      <AuthProvider>
        <DiscreetModeProvider>
          <SilentModeProvider>
            <LanAlertProvider>
              <MeshProvider>
                <FallDetectionProvider>
                  <AppNavigator />
                </FallDetectionProvider>
              </MeshProvider>
            </LanAlertProvider>
          </SilentModeProvider>
        </DiscreetModeProvider>
      </AuthProvider>
    </LanguageChosenContext.Provider>
  );
}