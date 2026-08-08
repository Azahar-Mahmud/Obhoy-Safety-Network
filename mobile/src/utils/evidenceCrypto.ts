import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const g = globalThis as any;

if (typeof g.crypto !== 'object') {
  g.crypto = {};
}
if (typeof g.crypto.getRandomValues !== 'function') {
  g.crypto.getRandomValues = function <T extends ArrayBufferView | null>(array: T): T {
    if (array && 'byteLength' in array) {
      const uint8 = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
      for (let i = 0; i < uint8.length; i++) {
        uint8[i] = Math.floor(Math.random() * 256);
      }
    }
    return array;
  };
}

CryptoJS.lib.WordArray.random = function (nBytes: number) {
  const words: number[] = [];
  for (let i = 0; i < nBytes; i += 4) {
    words.push((Math.random() * 0x100000000) | 0);
  }
  return CryptoJS.lib.WordArray.create(words, nBytes);
};

const KEY_STORE_KEY = 'obhoy_evidence_encryption_key';

async function getOrCreateKey(): Promise<string> {
  let key = await SecureStore.getItemAsync(KEY_STORE_KEY);
  if (!key) {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    key = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
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
  
  // FIX: Convert decrypted string back using Utf8, not Base64!
  const decryptedBase64 = CryptoJS.AES.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
  
  const destPath = `${FileSystem.cacheDirectory}evidence_decrypted_${Date.now()}.mp4`;
  await FileSystem.writeAsStringAsync(destPath, decryptedBase64, { encoding: FileSystem.EncodingType.Base64 });
  return destPath;
}