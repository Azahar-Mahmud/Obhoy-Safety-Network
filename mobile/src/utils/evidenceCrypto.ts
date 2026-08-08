import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import CryptoJS from 'crypto-js';

const KEY_STORE_KEY = 'obhoy_evidence_encryption_key';

async function getOrCreateKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(KEY_STORE_KEY);
  if (!key) {
    key = CryptoJS.lib.WordArray.random(32).toString();
    await SecureStore.setItemAsync(KEY_STORE_KEY, key);
  }
  return key;
}

export async function encryptFile(sourceUri: string): Promise<string> {
  const key = await getOrCreateKey();
  const base64Data = await FileSystem.readAsStringAsync(sourceUri, { encoding: FileSystem.EncodingType.Base64 });
  const encrypted = CryptoJS.AES.encrypt(base64Data, key).toString();
  const destPath = `${FileSystem.documentDirectory}evidence_${Date.now()}.enc`;
  await FileSystem.writeAsStringAsync(destPath, encrypted, { encoding: FileSystem.EncodingType.UTF8 });
  await FileSystem.deleteAsync(sourceUri, { idempotent: true });
  return destPath;
}

export async function decryptFile(encPath: string): Promise<string> {
  const key = await getOrCreateKey();
  const encrypted = await FileSystem.readAsStringAsync(encPath, { encoding: FileSystem.EncodingType.UTF8 });
  const decrypted = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Base64);
  const destPath = `${FileSystem.cacheDirectory}evidence_decrypted_${Date.now()}.mp4`;
  await FileSystem.writeAsStringAsync(destPath, decrypted, { encoding: FileSystem.EncodingType.Base64 });
  return destPath;
}