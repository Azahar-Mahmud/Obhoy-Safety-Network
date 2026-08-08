import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { encryptFile } from '../utils/evidenceCrypto';
import { checkLimits } from '../utils/evidenceLimits';
import { startEvidenceSession, pingEvidenceLocation, stopEvidenceSession } from '../utils/evidenceApi';
import * as Location from 'expo-location';

type Props = NativeStackScreenProps<RootStackParamList, 'EvidenceCapture'>;
const PING_INTERVAL_MS = 30000; // 30s location ping
const LIMIT_CHECK_MS = 15000;   // 15s battery/storage check

export default function EvidenceCaptureScreen({ route, navigation }: Props) {
  const autoStart = route.params?.autoStart ?? false;
  const cameraRef = useRef<CameraView>(null);
  const [recording, setRecording] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const sessionIdRef = useRef<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setInterval>[]>([]);

  const stopEverything = useCallback(async (uri?: string) => {
    timersRef.current.forEach(clearInterval);
    timersRef.current = [];
    setRecording(false);

    if (sessionIdRef.current) {
      try {
        await stopEvidenceSession(sessionIdRef.current);
      } catch (err) {
        console.error('[EVIDENCE] Error stopping session on backend:', err);
      }
      sessionIdRef.current = null;
    }

    if (uri) {
      setEncrypting(true);
      try {
        const encryptedPath = await encryptFile(uri);
        navigation.replace('EvidenceList', { justSavedPath: encryptedPath });
      } catch (err) {
        console.error('[EVIDENCE] Encryption error:', err);
        navigation.goBack();
      } finally {
        setEncrypting(false);
      }
    } else {
      navigation.goBack();
    }
  }, [navigation]);

  const startRecording = async () => {
    if (!cameraPermission?.granted || !micPermission?.granted) return;
    setRecording(true);

    try {
      const session = await startEvidenceSession();
      sessionIdRef.current = session.id;
    } catch (err) {
      console.warn('[EVIDENCE] Backend session creation failed, proceeding with local recording:', err);
    }

    const pingTimer = setInterval(async () => {
      try {
        const pos = await Location.getCurrentPositionAsync({});
        if (sessionIdRef.current) {
          await pingEvidenceLocation(sessionIdRef.current, pos.coords.latitude, pos.coords.longitude);
        }
      } catch {
        // Location ping skipped this cycle; recording continues uninterrupted
      }
    }, PING_INTERVAL_MS);

    const limitTimer = setInterval(async () => {
      const status = await checkLimits();
      if (status.mustStop) {
        cameraRef.current?.stopRecording();
      } else if (status.warning) {
        setWarning(status.warning);
      }
    }, LIMIT_CHECK_MS);

    timersRef.current = [pingTimer, limitTimer];

    const video = await cameraRef.current?.recordAsync();
    await stopEverything(video?.uri);
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
  };

  // Trigger auto-start if passed from SOS flow
  useEffect(() => {
    if (autoStart && cameraPermission?.granted && micPermission?.granted && !recording) {
      startRecording();
    }
  }, [autoStart, cameraPermission?.granted, micPermission?.granted]);

  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera and microphone access are needed for evidence capture.</Text>
        <TouchableOpacity style={styles.button} onPress={async () => {
          await requestCameraPermission();
          await requestMicPermission();
        }}>
          <Text style={styles.buttonText}>Grant Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} mode="video" style={styles.tinyCamera} />

      {warning && <Text style={styles.warning}>{warning}</Text>}

      {encrypting ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#6B21A8" />
          <Text style={styles.statusText}>Encrypting & Securing Evidence...</Text>
        </View>
      ) : (
        <>
          <Text style={styles.statusText}>
            {recording ? '🔴 Evidence Recording Active' : 'Ready to Record'}
          </Text>
          <TouchableOpacity
            style={[styles.button, recording && styles.buttonRecording]}
            onPress={recording ? stopRecording : startRecording}
          >
            <Text style={styles.buttonText}>{recording ? 'Stop & Encrypt' : 'Start Recording'}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F9FAFB' },
  tinyCamera: { width: 2, height: 2, opacity: 0.01, position: 'absolute' },
  text: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
  warning: { color: '#92400E', backgroundColor: '#FEF3C7', padding: 12, borderRadius: 8, marginBottom: 16, textAlign: 'center' },
  statusText: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 20 },
  centerBox: { alignItems: 'center' },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, paddingHorizontal: 32 },
  buttonRecording: { backgroundColor: '#DC2626' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});