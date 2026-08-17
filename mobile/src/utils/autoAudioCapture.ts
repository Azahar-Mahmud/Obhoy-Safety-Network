import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';
import { saveEvidenceWithType } from './evidenceStorage';
import { checkStorageBeforeCapture } from './storageCheck';

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
  try {
    const enabled = await isAutoAudioEnabled();
    if (!enabled) return;

    const storageOk = await checkStorageBeforeCapture();
    if (!storageOk.ok) return;

    const lengthSeconds = await getAutoAudioLengthSeconds();
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await recording.startAsync();

    setTimeout(async () => {
      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        if (uri) {
          await saveEvidenceWithType(uri, 'audio');
        }
      } catch (e) {
        console.warn('[AUTO-AUDIO] Stop recording error:', e);
      }
    }, lengthSeconds * 1000);
  } catch (err) {
    console.warn('[AUTO-AUDIO] Auto-audio error:', err);
  }
}