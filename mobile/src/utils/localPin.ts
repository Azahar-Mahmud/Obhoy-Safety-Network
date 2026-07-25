import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

const SALT_KEY = 'obhoy_local_pin_salt';
const HASH_KEY = 'obhoy_local_pin_hash';

async function getOrCreateSalt(): Promise<string> {
  const existing = await SecureStore.getItemAsync(SALT_KEY);
  if (existing) return existing;
  const bytes = await Crypto.getRandomBytesAsync(16);
  const salt = Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(SALT_KEY, salt);
  return salt;
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`, {
    encoding: Crypto.CryptoEncoding.HEX,
  });
}

export async function saveLocalPinVerifier(pin: string): Promise<void> {
  const salt = await getOrCreateSalt();
  const hash = await hashPin(pin, salt);
  await SecureStore.setItemAsync(HASH_KEY, hash);
}

export async function verifyLocalPin(pin: string): Promise<boolean> {
  const salt = await SecureStore.getItemAsync(SALT_KEY);
  const storedHash = await SecureStore.getItemAsync(HASH_KEY);
  if (!salt || !storedHash || !pin) return false;
  const hash = await hashPin(pin, salt);
  return hash === storedHash;
}