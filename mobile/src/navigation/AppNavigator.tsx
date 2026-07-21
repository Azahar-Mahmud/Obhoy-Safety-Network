import SosCountdownScreen from '../screens/SosCountdownScreen';
import SosConfirmationScreen from '../screens/SosConfirmationScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import PhoneEntryScreen from '../screens/PhoneEntryScreen';
import OtpScreen from '../screens/OtpScreen';
import SetPinScreen from '../screens/SetPinScreen';
import LoginPinScreen from '../screens/LoginPinScreen';
import HomeScreen from '../screens/HomeScreen';
import ContactsListScreen from '../screens/ContactsListScreen';
import AddContactScreen from '../screens/AddContactScreen';

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
    channel: 'backend' | 'native' | 'failed';
    contactsNotified: { name: string; phone: string; status: 'sent' | 'failed' }[];
    error?: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!token ? (
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
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}