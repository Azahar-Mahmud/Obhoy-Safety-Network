import * as SecureStore from 'expo-secure-store';
import { AudioModule, RecordingPresets, setAudioModeAsync } from 'expo-audio';
import { saveEvidenceWithType } from './evidenceStorage';

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

    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) {
      console.warn('[AUTO-AUDIO] Microphone permission not granted, skipping');
      return;
    }

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

    const lengthSeconds = await getAutoAudioLengthSeconds();
    
    // Access the recorder constructor directly from AudioModule
    const recorder = new (AudioModule as any).AudioRecorder(RecordingPresets.HIGH_QUALITY);

    await recorder.prepareToRecordAsync();
    recorder.record();
    console.log(`[AUTO-AUDIO] Recording started, ${lengthSeconds}s`);

    setTimeout(async () => {
      try {
        await recorder.stop();
        const uri = recorder.uri;
        if (uri) {
          await saveEvidenceWithType(uri, 'audio');
          console.log('[AUTO-AUDIO] Saved to evidence vault');
        }
      } catch (err) {
        console.warn('[AUTO-AUDIO] Stop/save error:', err);
      }
    }, lengthSeconds * 1000);
  } catch (err) {
    console.warn('[AUTO-AUDIO] Error:', err);
  }
}