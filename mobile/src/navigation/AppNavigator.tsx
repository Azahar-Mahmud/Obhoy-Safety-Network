import React, { useContext, useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';

// Contexts & i18n
import { useAuth } from '../context/AuthContext';
import { useDiscreetMode } from '../context/DiscreetModeContext';
import { useFallDetection } from '../context/FallDetectionContext';
import { useLanguage, t } from '../i18n';
import { LanguageChosenContext } from '../context/LanguageChosenContext';

// Main 4-Tab Navigator
import MainTabNavigator from './MainTabNavigator';

// Screens
import LanguageSelectScreen from '../screens/LanguageSelectScreen';
import OnboardingContactScreen from '../screens/onboarding/OnboardingContactScreen';
import OnboardingPermissionsScreen from '../screens/onboarding/OnboardingPermissionsScreen';
import OnboardingChoiceScreen from '../screens/onboarding/OnboardingChoiceScreen';
import OnboardingSliderScreen from '../screens/onboarding/OnboardingSliderScreen';

import PhoneEntryScreen from '../screens/PhoneEntryScreen';
import OtpScreen from '../screens/OtpScreen';
import SetPinScreen from '../screens/SetPinScreen';
import LoginPinScreen from '../screens/LoginPinScreen';
import ForgotPinScreen from '../screens/ForgotPinScreen'; // <--- NEW

import ContactsListScreen from '../screens/ContactsListScreen';
import AddContactScreen from '../screens/AddContactScreen';
import SosCountdownScreen from '../screens/SosCountdownScreen';
import SosConfirmationScreen from '../screens/SosConfirmationScreen';
import JourneySetupScreen from '../screens/JourneySetupScreen';
import ActiveJourneyScreen from '../screens/ActiveJourneyScreen';
import DirectoryScreen from '../screens/DirectoryScreen';
import AppGuideScreen from '../screens/AppGuideScreen';
import MapScreen from '../screens/MapScreen';
import MapPointPickerScreen from '../screens/MapPointPickerScreen';
import ReportCategoryScreen from '../screens/ReportCategoryScreen';
import EvidenceCaptureScreen from '../screens/EvidenceCaptureScreen';
import EvidenceGalleryScreen from '../screens/EvidenceGalleryScreen';
import NearbyAlertsScreen from '../screens/NearbyAlertsScreen';
import LastAlertStatusScreen from '../screens/LastAlertStatusScreen';
import MedicalCardEditScreen from '../screens/MedicalCardEditScreen';
import FallDetectedScreen from '../screens/FallDetectedScreen';
import MedicalCardScreen from '../screens/MedicalCardScreen';
import FamilyScreen from '../screens/FamilyScreen';
import FamilyInviteScreen from '../screens/FamilyInviteScreen';
import FamilyPrivacyScreen from '../screens/FamilyPrivacyScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileEditorScreen from '../screens/ProfileEditorScreen'; // <--- NEW
import SosMessageEditorScreen from '../screens/SosMessageEditorScreen'; // <--- NEW
import PracticeModeScreen from '../screens/PracticeModeScreen';
import PracticeSosScreen from '../screens/PracticeSosScreen';
import PracticeCheckinScreen from '../screens/PracticeCheckinScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  Home: undefined;
  LanguageSelect: undefined;
  OnboardingContact: undefined;
  OnboardingPermissions: undefined;
  OnboardingChoice: undefined;
  OnboardingSlider: { mode: 'onboarding' | 'replay' } | undefined;
  PhoneEntry: undefined;
  Otp: { phone: string; otpWindowSeconds: number };
  SetPin: { phone: string };
  LoginPin: { phone: string };
  ForgotPin: { phone?: string } | undefined; // <--- NEW
  ContactsList: undefined;
  AddContact: undefined;
  SosCountdown: undefined;
  SosConfirmation: { channel: string; contactsNotified: any[]; error?: string; };
  JourneySetup: { pickedLat?: number; pickedLng?: number; targetField?: 'from' | 'to'; } | undefined;
  MapPointPicker: { title: string; initialLat?: number; initialLng?: number; targetField: 'from' | 'to'; };
  ActiveJourney: { journeyId: string; checkinIntervalMinutes: number; mode?: 'interval' | 'scheduled'; scheduledDeadline?: string; };
  Directory: undefined;
  AppGuide: undefined;
  Map: undefined;
  ReportCategory: undefined;
  Calculator: undefined;
  Settings: undefined;
  ProfileEditor: undefined; // <--- NEW
  SosMessageEditor: undefined; // <--- NEW
  NearbyAlerts: undefined;
  MedicalCardEdit: undefined;
  LastAlertStatus: undefined;
  EvidenceCapture: { autoStart?: boolean } | undefined;
  EvidenceGallery: undefined;
  Family: undefined;
  FamilyInvite: undefined;
  FamilyPrivacy: undefined;
  PracticeMode: undefined;
  PracticeSos: undefined;
  PracticeCheckin: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  useLanguage(); 
  const { chosen: languageChosen } = useContext(LanguageChosenContext);
  const { token, isLoading: authLoading } = useAuth();
  const { discreetModeEnabled, isUnlocked, isLoading: discreetLoading } = useDiscreetMode();
  const { phase, resolveCountdown, escalateToCard } = useFallDetection();

  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    if (token) {
      SecureStore.getItemAsync('obhoy_onboarding_completed')
        .then((val) => {
          setOnboardingComplete(val === 'true');
        })
        .finally(() => setOnboardingChecked(true));
    } else {
      setOnboardingChecked(true);
    }
  }, [token]);

  if (authLoading || discreetLoading || !onboardingChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EFEBFA' }}>
        <ActivityIndicator size="large" color="#6B21A8" />
      </View>
    );
  }

  const showDisguise = discreetModeEnabled && !isUnlocked;

  if (!showDisguise && phase === 'countdown') return <FallDetectedScreen onResolved={resolveCountdown} onEscalate={escalateToCard} />;
  if (!showDisguise && phase === 'card') return <MedicalCardScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: true, 
          headerTitle: '',  
          headerStyle: { backgroundColor: '#EFEBFA' },
          headerShadowVisible: false,
          headerTintColor: '#6B21A8',
          contentStyle: { backgroundColor: '#EFEBFA' },
          animation: 'slide_from_right',
        }}
      >
        {showDisguise ? (
          <Stack.Screen name="Calculator" component={CalculatorScreen} options={{ headerShown: false }} />
        ) : !languageChosen ? (
          <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} options={{ headerShown: false }} />
        ) : !token ? (
          <>
            <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Otp" component={OtpScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SetPin" component={SetPinScreen} options={{ headerShown: false }} />
            <Stack.Screen name="LoginPin" component={LoginPinScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ForgotPin" component={ForgotPinScreen} />
          </>
        ) : (
          <>
            {!onboardingComplete && (
              <>
                <Stack.Screen name="OnboardingContact" component={OnboardingContactScreen} options={{ headerShown: false }} />
                <Stack.Screen name="OnboardingPermissions" component={OnboardingPermissionsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="OnboardingChoice" component={OnboardingChoiceScreen} options={{ headerShown: false }} />
              </>
            )}

            <Stack.Screen name="MainTabs" component={MainTabNavigator} options={{ headerShown: false }} />
            
            <Stack.Screen name="ContactsList" component={ContactsListScreen} />
            <Stack.Screen name="AddContact" component={AddContactScreen} />
            <Stack.Screen name="Family" component={FamilyScreen} />
            <Stack.Screen name="FamilyInvite" component={FamilyInviteScreen} />
            <Stack.Screen name="FamilyPrivacy" component={FamilyPrivacyScreen} />
            <Stack.Screen name="AppGuide" component={AppGuideScreen} />
            <Stack.Screen name="PracticeMode" component={PracticeModeScreen} />
            <Stack.Screen name="PracticeSos" component={PracticeSosScreen} />
            <Stack.Screen name="PracticeCheckin" component={PracticeCheckinScreen} />
            <Stack.Screen name="MedicalCardEdit" component={MedicalCardEditScreen} />
            <Stack.Screen name="NearbyAlerts" component={NearbyAlertsScreen} />
            <Stack.Screen name="LastAlertStatus" component={LastAlertStatusScreen} />
            <Stack.Screen name="EvidenceGallery" component={EvidenceGalleryScreen} />
            <Stack.Screen name="JourneySetup" component={JourneySetupScreen} />
            <Stack.Screen name="ActiveJourney" component={ActiveJourneyScreen} options={{ headerBackVisible: false }} />
            <Stack.Screen name="ReportCategory" component={ReportCategoryScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="ProfileEditor" component={ProfileEditorScreen} />
            <Stack.Screen name="SosMessageEditor" component={SosMessageEditorScreen} />
            <Stack.Screen name="OnboardingSlider" component={OnboardingSliderScreen} options={{ headerShown: false }} />
            <Stack.Screen name="MapPointPicker" component={MapPointPickerScreen} options={{ headerShown: false }} />
            <Stack.Screen name="EvidenceCapture" component={EvidenceCaptureScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SosCountdown" component={SosCountdownScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SosConfirmation" component={SosConfirmationScreen} options={{ headerBackVisible: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}