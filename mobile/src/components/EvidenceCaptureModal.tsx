import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions, CameraType } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radii } from '../theme/theme';
import { saveEvidenceWithType } from '../utils/evidenceStorage';
import { checkStorageBeforeCapture } from '../utils/storageCheck';

const { width, height } = Dimensions.get('window');
const VIDEO_CAP_SECONDS = 180; // 3-minute maximum per video clip

type CaptureMode = 'photo' | 'video' | 'audio';

interface EvidenceCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (encryptedPath: string) => void;
}

export function EvidenceCaptureModal({ visible, onClose, onSaved }: EvidenceCaptureModalProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [mode, setMode] = useState<CaptureMode>('photo');
  const [facing, setFacing] = useState<CameraType>('back');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [encrypting, setEncrypting] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>[]>([]);

  if (!visible) return null;

  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.permissionModal}>
          <View style={styles.permissionCard}>
            <View style={styles.permIconCircle}>
              <Feather name="camera" size={28} color={colors.primary} />
            </View>
            <Text style={styles.permissionTitle}>Camera & Mic Permissions</Text>
            <Text style={styles.permissionBody}>
              Camera and microphone access are required to record encrypted evidence for your private vault.
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
            <Pressable style={styles.cancelLink} onPress={onClose}>
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  const cleanup = () => {
    timerRef.current.forEach(clearInterval);
    timerRef.current = [];
    setRecording(false);
    setElapsed(0);
  };

  const handleSave = async (uri: string, type: 'photo' | 'video' | 'audio') => {
    setEncrypting(true);
    try {
      const encryptedPath = await saveEvidenceWithType(uri, type);
      if (onSaved) onSaved(encryptedPath);
      Alert.alert('Secured', 'Evidence encrypted and stored in private vault.');
    } catch (err) {
      console.error('[EVIDENCE] Encryption failed:', err);
      Alert.alert('Error', 'Failed to encrypt evidence file.');
    } finally {
      setEncrypting(false);
      cleanup();
      onClose();
    }
  };

  const takePhoto = async () => {
    const storage = await checkStorageBeforeCapture();
    if (!storage.ok) {
      Alert.alert('Storage Low', storage.message);
      return;
    }

    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        await handleSave(photo.uri, 'photo');
      }
    } catch (err) {
      console.error('[EVIDENCE] Photo error:', err);
      cleanup();
      onClose();
    }
  };

  const startVideo = async () => {
    const storage = await checkStorageBeforeCapture();
    if (!storage.ok) {
      Alert.alert('Storage Low', storage.message);
      return;
    }

    setRecording(true);
    setElapsed(0);

    const timer = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= VIDEO_CAP_SECONDS) {
          stopVideo();
          return VIDEO_CAP_SECONDS;
        }
        return prev + 1;
      });
    }, 1000);

    timerRef.current.push(timer);

    try {
      const video = await cameraRef.current?.recordAsync({ maxDuration: VIDEO_CAP_SECONDS });
      if (video?.uri) {
        await handleSave(video.uri, 'video');
      }
    } catch (err) {
      console.error('[EVIDENCE] Video error:', err);
      cleanup();
      onClose();
    }
  };

  const stopVideo = () => {
    cameraRef.current?.stopRecording();
  };

  const toggleCameraFacing = () => {
    setFacing((curr) => (curr === 'back' ? 'front' : 'back'));
  };

  const handleShutterPress = () => {
    if (mode === 'photo') {
      takePhoto();
    } else if (mode === 'video') {
      if (recording) stopVideo();
      else startVideo();
    } else if (mode === 'audio') {
      // Audio snapshot mode: records a 10s instant audio clip via video mic
      if (recording) stopVideo();
      else startVideo();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Live Camera Viewfinder */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          mode={mode === 'video' || mode === 'audio' ? 'video' : 'picture'}
        />

        {/* Rule-of-Thirds Grid Overlay */}
        <View style={styles.gridContainer} pointerEvents="none">
          <View style={[styles.gridLineHorizontal, { top: height * 0.33 }]} />
          <View style={[styles.gridLineHorizontal, { top: height * 0.66 }]} />
          <View style={[styles.gridLineVertical, { left: width * 0.33 }]} />
          <View style={[styles.gridLineVertical, { left: width * 0.66 }]} />
        </View>

        {/* Top Control Bar */}
        <View style={styles.topBar}>
          <Pressable style={styles.topIconButton} onPress={onClose} disabled={recording || encrypting}>
            <Feather name="x" size={24} color="#FFFFFF" />
          </Pressable>

          {recording ? (
            <View style={styles.timerBadge}>
              <View style={styles.redPulseDot} />
              <Text style={styles.timerBadgeText}>
                {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')} / 3:00
              </Text>
            </View>
          ) : (
            <View style={styles.vaultBadge}>
              <Feather name="shield" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.vaultBadgeText}>Encrypted Vault</Text>
            </View>
          )}

          <Pressable style={styles.topIconButton} onPress={toggleCameraFacing} disabled={recording || encrypting}>
            <Feather name="refresh-cw" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Bottom Control Bar */}
        <View style={styles.bottomBar}>
          {/* Segmented Mode Switcher */}
          {!recording && (
            <View style={styles.modeSwitcher}>
              {(['photo', 'video', 'audio'] as CaptureMode[]).map((m) => (
                <Pressable
                  key={m}
                  style={[styles.modeTab, mode === m && styles.modeTabActive]}
                  onPress={() => setMode(m)}
                >
                  <Text style={[styles.modeTabText, mode === m && styles.modeTabTextActive]}>
                    {m.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Shutter Button Row */}
          <View style={styles.shutterRow}>
            <View style={{ width: 44 }} />

            {/* Main Shutter */}
            <Pressable
              style={styles.shutterOuter}
              onPress={handleShutterPress}
              disabled={encrypting}
            >
              <View
                style={[
                  styles.shutterInner,
                  mode === 'photo' && styles.shutterPhoto,
                  mode === 'video' && !recording && styles.shutterVideoReady,
                  recording && styles.shutterRecordingStop,
                  mode === 'audio' && styles.shutterAudio,
                ]}
              />
            </Pressable>

            <View style={{ width: 44 }} />
          </View>
        </View>

        {/* Encrypting Overlay */}
        {encrypting && (
          <View style={styles.encryptingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.encryptingText}>Encrypting & Vaulting Evidence...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  
  // Rule-of-Thirds Grid
  gridContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },

  // Top Bar
  topBar: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 10,
  },
  topIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 33, 168, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.pill,
  },
  vaultBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.pill,
    gap: 8,
  },
  redPulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  timerBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingTop: spacing.md,
    paddingBottom: 40,
    alignItems: 'center',
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radii.pill,
    padding: 3,
    marginBottom: spacing.lg,
  },
  modeTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radii.pill,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
  },
  modeTabText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  modeTabTextActive: {
    color: '#111827',
  },

  // Shutter
  shutterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: spacing.xxl,
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  shutterPhoto: { backgroundColor: '#FFFFFF' },
  shutterVideoReady: { backgroundColor: colors.danger },
  shutterRecordingStop: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: colors.danger,
  },
  shutterAudio: { backgroundColor: colors.primary },

  // Encrypting overlay
  encryptingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    zIndex: 20,
  },
  encryptingText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },

  // Permissions Modal
  permissionModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: spacing.xl },
  permissionCard: { backgroundColor: '#FFFFFF', borderRadius: radii.lg, padding: spacing.xl, alignItems: 'center' },
  permIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  permissionTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  permissionBody: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: spacing.lg },
  permissionBtn: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 28, width: '100%', alignItems: 'center' },
  permissionBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  cancelLink: { marginTop: spacing.md, padding: 8 },
  cancelLinkText: { color: colors.textSecondary, fontWeight: '600' },
});