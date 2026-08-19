import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions, CameraType } from 'expo-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { RootStackParamList } from '../navigation/AppNavigator';
import { saveEvidenceWithType } from '../utils/evidenceStorage';
import { checkStorageBeforeCapture } from '../utils/storageCheck';
import { startEvidenceSession, pingEvidenceLocation, stopEvidenceSession } from '../utils/evidenceApi';
import { colors, spacing, radii } from '../theme/theme';

const { width, height } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'EvidenceCapture'>;
const PING_INTERVAL_MS = 30000;
const VIDEO_CAP_SECONDS = 180;

export default function EvidenceCaptureScreen({ route, navigation }: Props) {
  const autoStart = route.params?.autoStart ?? false;
  const cameraRef = useRef<CameraView>(null);
  const [recording, setRecording] = useState(false);
  const [encrypting, setEncrypting] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [facing, setFacing] = useState<CameraType>('back');

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
        await saveEvidenceWithType(uri, 'video');
        navigation.replace('EvidenceGallery');
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

    const storage = await checkStorageBeforeCapture();
    if (!storage.ok) {
      Alert.alert('Storage Low', storage.message);
      return;
    }

    setRecording(true);
    setElapsed(0);

    try {
      const session = await startEvidenceSession();
      sessionIdRef.current = session.id;
    } catch (err) {
      console.warn('[EVIDENCE] Backend session start warning:', err);
    }

    const pingTimer = setInterval(async () => {
      try {
        const pos = await Location.getCurrentPositionAsync({});
        if (sessionIdRef.current) {
          await pingEvidenceLocation(sessionIdRef.current, pos.coords.latitude, pos.coords.longitude);
        }
      } catch {}
    }, PING_INTERVAL_MS);

    const countdownTimer = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= VIDEO_CAP_SECONDS) {
          stopRecording();
          return VIDEO_CAP_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);

    timersRef.current = [pingTimer, countdownTimer];

    const video = await cameraRef.current?.recordAsync({ maxDuration: VIDEO_CAP_SECONDS });
    await stopEverything(video?.uri);
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
  };

  useEffect(() => {
    if (autoStart && cameraPermission?.granted && micPermission?.granted && !recording) {
      startRecording();
    }
  }, [autoStart, cameraPermission?.granted, micPermission?.granted]);

  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <View style={styles.permissionScreen}>
        <View style={styles.permIconCircle}>
          <Feather name="camera" size={32} color={colors.primary} />
        </View>
        <Text style={styles.permissionTitle}>Camera & Microphone Access</Text>
        <Text style={styles.permissionBody}>
          Permission is needed to record encrypted incident video and audio evidence.
        </Text>
        <Pressable
          style={styles.permissionBtn}
          onPress={async () => {
            await requestCameraPermission();
            await requestMicPermission();
          }}
        >
          <Text style={styles.permissionBtnText}>Grant Access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        mode="video"
        facing={facing}
        style={StyleSheet.absoluteFill}
      />

      {/* Rule of Thirds Grid */}
      <View style={styles.gridContainer} pointerEvents="none">
        <View style={[styles.gridLineHorizontal, { top: height * 0.33 }]} />
        <View style={[styles.gridLineHorizontal, { top: height * 0.66 }]} />
        <View style={[styles.gridLineVertical, { left: width * 0.33 }]} />
        <View style={[styles.gridLineVertical, { left: width * 0.66 }]} />
      </View>

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => navigation.goBack()} disabled={recording || encrypting}>
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>

        {recording ? (
          <View style={styles.timerBadge}>
            <View style={styles.redPulseDot} />
            <Text style={styles.timerText}>
              {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')} / 3:00
            </Text>
          </View>
        ) : (
          <View style={styles.vaultBadge}>
            <Feather name="shield" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.vaultBadgeText}>Encrypted Capture</Text>
          </View>
        )}

        <Pressable style={styles.iconButton} onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} disabled={recording || encrypting}>
          <Feather name="refresh-cw" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <Pressable
          style={styles.shutterOuter}
          onPress={recording ? stopRecording : startRecording}
          disabled={encrypting}
        >
          <View style={[styles.shutterInner, recording && styles.shutterRecordingStop]} />
        </Pressable>
      </View>

      {/* Encrypting State */}
      {encrypting && (
        <View style={styles.encryptingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.encryptingText}>Encrypting & Storing in Vault...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLineHorizontal: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  gridLineVertical: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255, 255, 255, 0.15)' },
  topBar: { position: 'absolute', top: 48, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, zIndex: 10 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0, 0, 0, 0.45)', alignItems: 'center', justifyContent: 'center' },
  vaultBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(107, 33, 168, 0.75)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: radii.pill },
  vaultBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  timerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', paddingVertical: 6, paddingHorizontal: 14, borderRadius: radii.pill, gap: 8 },
  redPulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  timerText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.55)', paddingVertical: 36, alignItems: 'center' },
  shutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.danger },
  shutterRecordingStop: { width: 30, height: 30, borderRadius: 6 },
  encryptingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', gap: spacing.md, zIndex: 20 },
  encryptingText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  permissionScreen: { flex: 1, backgroundColor: '#FAFAFA', justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  permIconCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  permissionTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  permissionBody: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing.xl },
  permissionBtn: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', width: '100%' },
  permissionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
});