import './src/polyfills';
import React, { useEffect } from 'react'; // <--- UPDATED
import { AppState, AppStateStatus } from 'react-native'; // <--- NEW
import { recordLastActive } from './src/utils/lastActive'; // <--- NEW

import { SilentModeProvider } from './src/context/SilentModeContext';
import { FallDetectionProvider } from './src/context/FallDetectionContext';
import { AuthProvider } from './src/context/AuthContext';
import { DiscreetModeProvider } from './src/context/DiscreetModeContext';
import { LanAlertProvider } from './src/context/LanAlertContext';
import { MeshProvider } from './src/context/MeshContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  
  // === NEW: TRACK LAST ACTIVE TIME ===
  useEffect(() => {
    // Record once when the app first starts up
    recordLastActive();
    
    // Listen for the app coming back from the background
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        recordLastActive();
      }
    });
    
    return () => subscription.remove();
  }, []);
  // ===================================

  return (
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
  );
}