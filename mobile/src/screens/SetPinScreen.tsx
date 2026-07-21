import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'SetPin'>;

export default function SetPinScreen({ route }: Props) {
  const { phone } = route.params;
  const { signIn } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');

  const handleSetPin = async () => {
    setError('');
    if (pin !== confirmPin) {
      setError('PINs do not match.');
      return;
    }
    try {
      const data = await apiRequest('/auth/signup/set-pin', {
        method: 'POST',
        body: JSON.stringify({ phone, pin }),
      });
      await signIn(data.token);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose a 4 to 6 digit PIN</Text>
      <Text style={styles.subtitle}>You'll use this to log in from now on.</Text>
      <TextInput style={styles.input} placeholder="New PIN" keyboardType="number-pad" secureTextEntry maxLength={6} value={pin} onChangeText={setPin} />
      <TextInput style={styles.input} placeholder="Confirm PIN" keyboardType="number-pad" secureTextEntry maxLength={6} value={confirmPin} onChangeText={setConfirmPin} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSetPin} disabled={pin.length < 4}>
        <Text style={styles.buttonText}>Finish</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#6B7280', borderRadius: 8, padding: 14, fontSize: 16, marginBottom: 12, textAlign: 'center', letterSpacing: 4 },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  error: { color: '#DC2626', marginBottom: 12 },
});