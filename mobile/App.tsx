import './src/polyfills';
import { SilentModeProvider } from './src/context/SilentModeContext';
import React from 'react';
import { FallDetectionProvider } from './src/context/FallDetectionContext';
import { AuthProvider } from './src/context/AuthContext';
import { DiscreetModeProvider } from './src/context/DiscreetModeContext';
import { LanAlertProvider } from './src/context/LanAlertContext';
import { MeshProvider } from './src/context/MeshContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
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