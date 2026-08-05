import './src/polyfills';
import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { DiscreetModeProvider } from './src/context/DiscreetModeContext';
import { LanAlertProvider } from './src/context/LanAlertContext';
import { MeshProvider } from './src/context/MeshContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <DiscreetModeProvider>
        <LanAlertProvider>
          <MeshProvider>
            <AppNavigator />
          </MeshProvider>
        </LanAlertProvider>
      </DiscreetModeProvider>
    </AuthProvider>
  );
}