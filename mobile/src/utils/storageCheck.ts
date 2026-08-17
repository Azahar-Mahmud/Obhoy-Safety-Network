import * as FileSystem from 'expo-file-system/legacy';

const MIN_FREE_BYTES = 100 * 1024 * 1024; // 100MB floor

export async function checkStorageBeforeCapture(): Promise<{ ok: boolean; message?: string }> {
  try {
    const free = await FileSystem.getFreeDiskStorageAsync();
    if (free < MIN_FREE_BYTES) {
      return { ok: false, message: 'Not enough storage space on device to record evidence.' };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}