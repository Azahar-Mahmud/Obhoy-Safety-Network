import React, { useContext } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppGuideScreen from '../screens/AppGuideScreen';

// Contexts & i18n
import { useAuth } from '../context/AuthContext';
import { useDiscreetMode } from '../context/DiscreetModeContext';
import { useFallDetection } from '../context/FallDetectionContext';
import { useLanguage, t } from '../i18n';
import { LanguageChosenContext } from '../context/LanguageChosenContext';

// First-Run Screen
import LanguageSelectScreen from '../screens/LanguageSelectScreen';

// Auth Screens
import PhoneEntryScreen from '../screens/PhoneEntryScreen';
import OtpScreen from '../screens/OtpScreen';
import SetPinScreen from '../screens/SetPinScreen';
import LoginPinScreen from '../screens/LoginPinScreen';

// Main App Screens
import HomeScreen from '../screens/HomeScreen';
import ContactsListScreen from '../screens/ContactsListScreen';
import AddContactScreen from '../screens/AddContactScreen';
import SosCountdownScreen from '../screens/SosCountdownScreen';
import SosConfirmationScreen from '../screens/SosConfirmationScreen';
import JourneySetupScreen from '../screens/JourneySetupScreen';
import ActiveJourneyScreen from '../screens/ActiveJourneyScreen';
import DirectoryScreen from '../screens/DirectoryScreen';
import MapScreen from '../screens/MapScreen';
import ReportCategoryScreen from '../screens/ReportCategoryScreen';
import ReportConfirmScreen from '../screens/ReportConfirmScreen';
import ReportDescriptionScreen from '../screens/ReportDescriptionScreen';
import ReportSuccessScreen from '../screens/ReportSuccessScreen';
import EvidenceCaptureScreen from '../screens/EvidenceCaptureScreen';
import EvidenceListScreen from '../screens/EvidenceListScreen';
import NearbyAlertsScreen from '../screens/NearbyAlertsScreen';
import LastAlertStatusScreen from '../screens/LastAlertStatusScreen';
import MedicalCardEditScreen from '../screens/MedicalCardEditScreen';
import FallDetectedScreen from '../screens/FallDetectedScreen';
import MedicalCardScreen from '../screens/MedicalCardScreen';

// Family Screens (Obhoy_31)
import FamilyScreen from '../screens/FamilyScreen';
import FamilyInviteScreen from '../screens/FamilyInviteScreen';
import FamilyPrivacyScreen from '../screens/FamilyPrivacyScreen';

// Discreet Mode Screen
import CalculatorScreen from '../screens/CalculatorScreen';
import SettingsScreen from '../screens/SettingsScreen';

export type RootStackParamList = {
  LanguageSelect: undefined;
  PhoneEntry: undefined;
  Otp: { phone: string; otpWindowSeconds: number };
  SetPin: { phone: string };
  LoginPin: { phone: string };
  Home: undefined;
  ContactsList: undefined;
  AddContact: undefined;
  SosCountdown: undefined;
  SosConfirmation: {
    channel: 'backend' | 'native' | 'lan' | 'mesh' | 'failed';
    contactsNotified: { name: string; phone: string; status: 'sent' | 'failed' }[];
    lanBroadcastSent?: boolean;
    meshBroadcastSent?: boolean;
    error?: string;
  };
  JourneySetup: undefined;
  ActiveJourney: { 
    journeyId: string; 
    checkinIntervalMinutes: number; 
    mode?: 'interval' | 'scheduled'; 
    scheduledDeadline?: string; 
  };
  Directory: undefined;
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
  Family: undefined;
  FamilyInvite: undefined;
  FamilyPrivacy: undefined;
  AppGuide: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  useLanguage(); // Subscribe so header titles re-render immediately on language toggle
  const { chosen: languageChosen } = useContext(LanguageChosenContext);
  const { token, isLoading: authLoading } = useAuth();
  const { discreetModeEnabled, isUnlocked, isLoading: discreetLoading } = useDiscreetMode();
  const { phase, resolveCountdown, escalateToCard } = useFallDetection();

  if (authLoading || discreetLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#6B21A8" />
      </View>
    );
  }

  const showDisguise = discreetModeEnabled && !isUnlocked;

  // 1. Intercept navigation for emergencies
  if (!showDisguise && phase === 'countdown') {
    return <FallDetectedScreen onResolved={resolveCountdown} onEscalate={escalateToCard} />;
  }
  
  if (!showDisguise && phase === 'card') {
    return <MedicalCardScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: !showDisguise }}>
        {showDisguise ? (
          <Stack.Screen name="Calculator" component={CalculatorScreen} options={{ headerShown: false }} />
        ) : !languageChosen ? (
          <Stack.Screen name="LanguageSelect" component={LanguageSelectScreen} options={{ headerShown: false }} />
        ) : !token ? (
          <>
            <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} options={{ title: 'Obhoy' }} />
            <Stack.Screen name="Otp" component={OtpScreen} options={{ title: 'Verify' }} />
            <Stack.Screen name="SetPin" component={SetPinScreen} options={{ title: t('auth.set_pin_title') }} />
            <Stack.Screen name="LoginPin" component={LoginPinScreen} options={{ title: t('auth.login_pin_title') }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Obhoy' }} />
            <Stack.Screen name="Family" component={FamilyScreen} options={{ title: t('family.title') }} />
            <Stack.Screen name="FamilyInvite" component={FamilyInviteScreen} options={{ title: t('family.add_member') }} />
            <Stack.Screen name="FamilyPrivacy" component={FamilyPrivacyScreen} options={{ title: t('family.privacy') }} />
            <Stack.Screen name="ContactsList" component={ContactsListScreen} options={{ title: t('contacts.title') }} />
            <Stack.Screen name="AddContact" component={AddContactScreen} options={{ title: t('contacts.add_title') }} />
            <Stack.Screen name="SosCountdown" component={SosCountdownScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SosConfirmation" component={SosConfirmationScreen} options={{ title: t('sos.sent_title') }} />
            <Stack.Screen name="JourneySetup" component={JourneySetupScreen} options={{ title: t('journey.start') }} />
            <Stack.Screen name="ActiveJourney" component={ActiveJourneyScreen} options={{ title: t('home.journey'), headerBackVisible: false }} />
            <Stack.Screen name="Directory" component={DirectoryScreen} options={{ title: t('dir.title') }} />
            {/* Added AppGuide Screen */}
            <Stack.Screen name="AppGuide" component={AppGuideScreen} options={{ title: 'App Guide' }} />
            <Stack.Screen name="Map" component={MapScreen} options={{ title: t('map.title') }} />
            <Stack.Screen name="ReportCategory" component={ReportCategoryScreen} options={{ title: t('map.report_button') }} />
            <Stack.Screen name="ReportConfirm" component={ReportConfirmScreen} options={{ title: t('report.confirm_location') }} />
            <Stack.Screen name="ReportDescription" component={ReportDescriptionScreen} options={{ title: t('report.description') }} />
            <Stack.Screen name="ReportSuccess" component={ReportSuccessScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t('settings.title') }} />
            <Stack.Screen name="NearbyAlerts" component={NearbyAlertsScreen} options={{ title: t('home.nearby_alerts') }} />
            <Stack.Screen name="MedicalCardEdit" component={MedicalCardEditScreen} options={{ title: t('settings.medical_card') }} />
            <Stack.Screen name="LastAlertStatus" component={LastAlertStatusScreen} options={{ title: t('sos.last_alert_title') }} />
            <Stack.Screen name="EvidenceCapture" component={EvidenceCaptureScreen} options={{ title: t('home.evidence') }} />
            <Stack.Screen name="EvidenceList" component={EvidenceListScreen} options={{ title: t('home.evidence') }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}