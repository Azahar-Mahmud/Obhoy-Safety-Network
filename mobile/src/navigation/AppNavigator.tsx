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

// Screens
import LanguageSelectScreen from '../screens/LanguageSelectScreen';
import OnboardingContactScreen from '../screens/onboarding/OnboardingContactScreen';
import OnboardingPermissionsScreen from '../screens/onboarding/OnboardingPermissionsScreen';
import OnboardingTestSosScreen from '../screens/onboarding/OnboardingTestSosScreen';
import PhoneEntryScreen from '../screens/PhoneEntryScreen';
import OtpScreen from '../screens/OtpScreen';
import SetPinScreen from '../screens/SetPinScreen';
import LoginPinScreen from '../screens/LoginPinScreen';
import HomeScreen from '../screens/HomeScreen';
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
import ReportConfirmScreen from '../screens/ReportConfirmScreen';
import ReportDescriptionScreen from '../screens/ReportDescriptionScreen';
import ReportSuccessScreen from '../screens/ReportSuccessScreen';
import EvidenceCaptureScreen from '../screens/EvidenceCaptureScreen';
import EvidenceListScreen from '../screens/EvidenceListScreen';
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
import PracticeModeScreen from '../screens/PracticeModeScreen';
import PracticeSosScreen from '../screens/PracticeSosScreen';
import PracticeCheckinScreen from '../screens/PracticeCheckinScreen';

export type RootStackParamList = {
  LanguageSelect: undefined;
  OnboardingContact: undefined;
  OnboardingPermissions: undefined;
  OnboardingTestSos: undefined;
  PhoneEntry: undefined;
  Otp: { phone: string; otpWindowSeconds: number };
  SetPin: { phone: string };
  LoginPin: { phone: string };
  Home: undefined;
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
  ReportConfirm: { category: string };
  ReportDescription: { category: string; lat: number; lng: number };
  ReportSuccess: undefined;
  Calculator: undefined;
  Settings: undefined;
  NearbyAlerts: undefined;
  MedicalCardEdit: undefined;
  LastAlertStatus: undefined;
  EvidenceCapture: { autoStart?: boolean } | undefined;
  EvidenceList: { justSavedPath: string };
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#6B21A8" />
      </View>
    );
  }

  const showDisguise = discreetModeEnabled && !isUnlocked;

  if (!showDisguise && phase === 'countdown') return <FallDetectedScreen onResolved={resolveCountdown} onEscalate={escalateToCard} />;
  if (!showDisguise && phase === 'card') return <MedicalCardScreen />;

  return (
    <NavigationContainer>
      {/* 
        This is the change! Headers hidden globally, 
        Slide animations, and background color matches our theme 
      */}
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: '#F7F5FA' } }}>
        {showDisguise ? (
          <Stack.Screen name="Calculator" component={CalculatorScreen} />
        ) : !languageChosen ? (
          <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} />
        ) : !token ? (
          <>
            <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
            <Stack.Screen name="SetPin" component={SetPinScreen} />
            <Stack.Screen name="LoginPin" component={LoginPinScreen} />
          </>
        ) : (
          <>
            {!onboardingComplete && (
              <>
                <Stack.Screen name="OnboardingContact" component={OnboardingContactScreen} />
                <Stack.Screen name="OnboardingPermissions" component={OnboardingPermissionsScreen} />
                <Stack.Screen name="OnboardingTestSos" component={OnboardingTestSosScreen} />
              </>
            )}
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Family" component={FamilyScreen} />
            <Stack.Screen name="FamilyInvite" component={FamilyInviteScreen} />
            <Stack.Screen name="FamilyPrivacy" component={FamilyPrivacyScreen} />
            <Stack.Screen name="ContactsList" component={ContactsListScreen} />
            <Stack.Screen name="AddContact" component={AddContactScreen} />
            <Stack.Screen name="SosCountdown" component={SosCountdownScreen} />
            <Stack.Screen name="SosConfirmation" component={SosConfirmationScreen} />
            <Stack.Screen name="JourneySetup" component={JourneySetupScreen} />
            <Stack.Screen name="MapPointPicker" component={MapPointPickerScreen} />
            <Stack.Screen name="ActiveJourney" component={ActiveJourneyScreen} />
            <Stack.Screen name="Directory" component={DirectoryScreen} />
            <Stack.Screen name="AppGuide" component={AppGuideScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="ReportCategory" component={ReportCategoryScreen} />
            <Stack.Screen name="ReportConfirm" component={ReportConfirmScreen} />
            <Stack.Screen name="ReportDescription" component={ReportDescriptionScreen} />
            <Stack.Screen name="ReportSuccess" component={ReportSuccessScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="NearbyAlerts" component={NearbyAlertsScreen} />
            <Stack.Screen name="MedicalCardEdit" component={MedicalCardEditScreen} />
            <Stack.Screen name="LastAlertStatus" component={LastAlertStatusScreen} />
            <Stack.Screen name="EvidenceCapture" component={EvidenceCaptureScreen} />
            <Stack.Screen name="EvidenceList" component={EvidenceListScreen} />
            <Stack.Screen name="EvidenceGallery" component={EvidenceGalleryScreen} />
            <Stack.Screen name="PracticeMode" component={PracticeModeScreen} />
            <Stack.Screen name="PracticeSos" component={PracticeSosScreen} />
            <Stack.Screen name="PracticeCheckin" component={PracticeCheckinScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}