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
  const fileInfo = await FileSystem.getInfoAsync(sourceUri);
  const fileSize = fileInfo.exists ? fileInfo.size : 0;

  const sessionDir = `${FileSystem.documentDirectory}evidence_${Date.now()}/`;
  await FileSystem.makeDirectoryAsync(sessionDir, { intermediates: true });

  const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunk
  let position = 0;
  let chunkIndex = 0;

  while (position < fileSize) {
    const length = Math.min(CHUNK_SIZE, fileSize - position);
    const chunkBase64 = await FileSystem.readAsStringAsync(sourceUri, {
      encoding: FileSystem.EncodingType.Base64,
      position,
      length,
    });

    const encryptedChunk = CryptoJS.AES.encrypt(chunkBase64, key).toString();
    const chunkPath = `${sessionDir}chunk_${chunkIndex}.enc`;

    await FileSystem.writeAsStringAsync(chunkPath, encryptedChunk, { encoding: FileSystem.EncodingType.UTF8 });

    position += length;
    chunkIndex++;
  }

  // Delete raw unencrypted source file
  await FileSystem.deleteAsync(sourceUri, { idempotent: true });
  return sessionDir;
}

// --- UPDATED: Supports custom extensions (.jpg, .mp4, .m4a) ---
export async function decryptFile(sessionDir: string, extension: string = 'mp4'): Promise<string> {
  const key = await getOrCreateKey();
  const destPath = `${FileSystem.cacheDirectory}evidence_decrypted_${Date.now()}.${extension}`;

  await FileSystem.writeAsStringAsync(destPath, '', { encoding: FileSystem.EncodingType.Base64 });

  const dirContents = await FileSystem.readDirectoryAsync(sessionDir);
  const chunkFiles = dirContents
    .filter((f) => f.startsWith('chunk_') && f.endsWith('.enc'))
    .sort((a, b) => {
      const idxA = parseInt(a.replace('chunk_', '').replace('.enc', ''), 10);
      const idxB = parseInt(b.replace('chunk_', '').replace('.enc', ''), 10);
      return idxA - idxB;
    });

  for (const file of chunkFiles) {
    const chunkPath = `${sessionDir}${file}`;
    const encryptedChunk = await FileSystem.readAsStringAsync(chunkPath, { encoding: FileSystem.EncodingType.UTF8 });
    const decryptedBase64 = CryptoJS.AES.decrypt(encryptedChunk, key).toString(CryptoJS.enc.Utf8);

    await FileSystem.writeAsStringAsync(destPath, decryptedBase64, {
      encoding: FileSystem.EncodingType.Base64,
      append: true,
    });
  }

  return destPath;
}