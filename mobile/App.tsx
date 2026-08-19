import './src/polyfills';
import React, { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { recordLastActive } from './src/utils/lastActive';
import { loadLanguage } from './src/i18n';
import { publishLocation } from './src/utils/familyLocation';

import { ThemeProvider } from './src/context/ThemeContext'; // <--- ThemeProvider
import { LanguageChosenContext } from './src/context/LanguageChosenContext';
import { SilentModeProvider } from './src/context/SilentModeContext';
import { FallDetectionProvider } from './src/context/FallDetectionContext';
import { AuthProvider } from './src/context/AuthContext';
import { DiscreetModeProvider, useDiscreetMode } from './src/context/DiscreetModeContext';
import { SimpleModeProvider } from './src/context/SimpleModeContext';
import { LanAlertProvider } from './src/context/LanAlertContext';
import { MeshProvider } from './src/context/MeshContext';
import AppNavigator from './src/navigation/AppNavigator';
import IntroScreen from './src/screens/IntroScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

function StartupGate() {
  const { discreetModeEnabled, isLoading } = useDiscreetMode();
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (discreetModeEnabled) {
      setShowIntro(false);
      return;
    }
    const timer = setTimeout(() => setShowIntro(false), 1500);
    return () => clearTimeout(timer);
  }, [isLoading, discreetModeEnabled]);

  if (isLoading) return null;
  if (showIntro && !discreetModeEnabled) return <IntroScreen />;
  
  return <AppNavigator />;
}

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [languageChosen, setLanguageChosen] = useState<boolean>(false);

  useEffect(() => {
    async function prepare() {
      try {
        const lang = await loadLanguage();
        setLanguageChosen(lang !== null);
      } catch (e) {
        console.warn('Startup init error:', e);
      } finally {
        setAppReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    recordLastActive();
    publishLocation();
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        recordLastActive();
        publishLocation();
      }
    });
    return () => subscription.remove();
  }, []);

  if (!appReady) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageChosenContext.Provider
          value={{ chosen: languageChosen, markChosen: () => setLanguageChosen(true) }}
        >
          <AuthProvider>
            <DiscreetModeProvider>
              <SimpleModeProvider>
                <SilentModeProvider>
                  <LanAlertProvider>
                    <MeshProvider>
                      <FallDetectionProvider>
                        <StartupGate />
                      </FallDetectionProvider>
                    </MeshProvider>
                  </LanAlertProvider>
                </SilentModeProvider>
              </SimpleModeProvider>
            </DiscreetModeProvider>
          </AuthProvider>
        </LanguageChosenContext.Provider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}