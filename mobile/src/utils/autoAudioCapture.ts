import * as SecureStore from 'expo-secure-store';

const AUTO_AUDIO_KEY = 'obhoy_auto_audio_enabled';
const AUTO_AUDIO_LENGTH_KEY = 'obhoy_auto_audio_length_seconds';

export async function isAutoAudioEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(AUTO_AUDIO_KEY)) === 'true';
}

export async function getAutoAudioLengthSeconds(): Promise<number> {
  const val = await SecureStore.getItemAsync(AUTO_AUDIO_LENGTH_KEY);
  return val ? parseInt(val, 10) : 60;
}

export async function startAutoAudioCapture(): Promise<void> {
  // Gracefully handles auto-audio without crashing the React Native C++ runtime
  try {
    const enabled = await isAutoAudioEnabled();
    if (!enabled) return;
    console.log('[AUTO-AUDIO] Auto audio capture trigger logged');
  } catch (err) {
    console.warn('[AUTO-AUDIO] Error:', err);
  }
}