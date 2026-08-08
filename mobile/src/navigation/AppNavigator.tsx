import EvidenceListScreen from '../screens/EvidenceListScreen';
import NearbyAlertsScreen from '../screens/NearbyAlertsScreen';
import LastAlertStatusScreen from '../screens/LastAlertStatusScreen';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Contexts
import { useAuth } from '../context/AuthContext';
import { useDiscreetMode } from '../context/DiscreetModeContext';

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
import EvidenceCaptureScreen from '../screens/EvidenceCaptureScreen'; // <--- NEW IMPORT

// Discreet Mode Screens
import CalculatorScreen from '../screens/CalculatorScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Medical Card Screen
import MedicalCardEditScreen from '../screens/MedicalCardEditScreen';
import { useFallDetection } from '../context/FallDetectionContext';
import FallDetectedScreen from '../screens/FallDetectedScreen';
import MedicalCardScreen from '../screens/MedicalCardScreen';

export type RootStackParamList = {
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
  ActiveJourney: { journeyId: string; checkinIntervalMinutes: number };
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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { token, isLoading: authLoading } = useAuth();
  const { discreetModeEnabled, isUnlocked, isLoading: discreetLoading } = useDiscreetMode();
  
  // 1. Get the current Fall Detection state
  const { phase, resolveCountdown, escalateToCard, dismissCard } = useFallDetection();

  if (authLoading || discreetLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#6B21A8" />
      </View>
    );
  }

  const showDisguise = discreetModeEnabled && !isUnlocked;

  // 2. Intercept navigation for emergencies!
  // (We check !showDisguise because we don't want to blow the calculator cover)
  if (!showDisguise && phase === 'countdown') {
    return <FallDetectedScreen onResolved={resolveCountdown} onEscalate={escalateToCard} />;
  }
  
  if (!showDisguise && phase === 'card') {
    return <MedicalCardScreen />;
    // Note: dismissCard isn't wired to a button on the card deliberately — a paramedic
    // shouldn't accidentally close it. The user has to close/restart the app to dismiss it.
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: !showDisguise }}>
        {showDisguise ? (
          <Stack.Screen name="Calculator" component={CalculatorScreen} options={{ headerShown: false }} />
        ) : !token ? (
          <>
            <Stack.Screen name="PhoneEntry" component={PhoneEntryScreen} options={{ title: 'Obhoy' }} />
            <Stack.Screen name="Otp" component={OtpScreen} options={{ title: 'Verify' }} />
            <Stack.Screen name="SetPin" component={SetPinScreen} options={{ title: 'Set your PIN' }} />
            <Stack.Screen name="LoginPin" component={LoginPinScreen} options={{ title: 'Enter PIN' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Obhoy' }} />
            <Stack.Screen name="ContactsList" component={ContactsListScreen} options={{ title: 'Trusted Contacts' }} />
            <Stack.Screen name="AddContact" component={AddContactScreen} options={{ title: 'Add Contact' }} />
            <Stack.Screen name="SosCountdown" component={SosCountdownScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SosConfirmation" component={SosConfirmationScreen} options={{ title: 'SOS Status' }} />
            <Stack.Screen name="JourneySetup" component={JourneySetupScreen} options={{ title: 'Start Journey' }} />
            <Stack.Screen name="ActiveJourney" component={ActiveJourneyScreen} options={{ title: 'Journey Active', headerBackVisible: false }} />
            <Stack.Screen name="Directory" component={DirectoryScreen} options={{ title: 'Emergency Directory' }} />
            <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Unsafe Zone Map' }} />
            <Stack.Screen name="ReportCategory" component={ReportCategoryScreen} options={{ title: 'Report' }} />
            <Stack.Screen name="ReportConfirm" component={ReportConfirmScreen} options={{ title: 'Confirm Location' }} />
            <Stack.Screen name="ReportDescription" component={ReportDescriptionScreen} options={{ title: 'Add Details' }} />
            <Stack.Screen name="ReportSuccess" component={ReportSuccessScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
            <Stack.Screen name="NearbyAlerts" component={NearbyAlertsScreen} options={{ title: 'Nearby Alerts' }} />
            <Stack.Screen name="MedicalCardEdit" component={MedicalCardEditScreen} options={{ title: 'Medical Card' }} />
            <Stack.Screen name="LastAlertStatus" component={LastAlertStatusScreen} options={{ title: 'Last Alert' }} />
            <Stack.Screen name="EvidenceCapture" component={EvidenceCaptureScreen} options={{ title: 'Recording' }} />
            <Stack.Screen name="EvidenceList" component={EvidenceListScreen} options={{ title: 'Evidence Saved' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}