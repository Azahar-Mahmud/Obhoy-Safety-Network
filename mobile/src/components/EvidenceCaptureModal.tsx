import React, { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../theme/theme';
import { encryptFile } from '../utils/evidenceCrypto';

const VIDEO_CAP_SECONDS = 180; // 3-minute maximum per video clip

interface EvidenceCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (encryptedPath: string) => void;
}

export function EvidenceCaptureModal({ visible, onClose, onSaved }: EvidenceCaptureModalProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [mode, setMode] = useState<'choose' | 'photo' | 'video'>('choose');
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
            <Text style={styles.permissionTitle}>Camera & Mic Permissions</Text>
            <Text style={styles.permissionBody}>
              Camera and microphone access are required to record encrypted evidence.
            </Text>
            <Pressable
              style={styles.permissionBtn}
              onPress={async () => {
                await requestCameraPermission();
                await requestMicPermission();
              }}
            >
              <Text style={styles.permissionBtnText}>Grant Permissions</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelLabel}>Cancel</Text>
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
    setMode('choose');
    setElapsed(0);
  };

  const handleSaveAndClose = async (uri: string) => {
    setEncrypting(true);
    try {
      const encryptedPath = await encryptFile(uri);
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
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
      if (photo?.uri) {
        await handleSaveAndClose(photo.uri);
      }
    } catch (err) {
      console.error('[EVIDENCE] Photo capture error:', err);
      cleanup();
      onClose();
    }
  };

  const startVideo = async () => {
    setMode('video');
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
        await handleSaveAndClose(video.uri);
      }
    } catch (err) {
      console.error('[EVIDENCE] Video record error:', err);
      cleanup();
      onClose();
    }
  };

  const stopVideo = () => {
    cameraRef.current?.stopRecording();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          mode={mode === 'video' ? 'video' : 'picture'}
        />

        {encrypting ? (
          <View style={styles.encryptingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.encryptingText}>Encrypting & Vaulting Evidence...</Text>
          </View>
        ) : (
          <>
            {mode === 'choose' && (
              <View style={styles.chooser}>
                <Pressable style={styles.choiceBtn} onPress={takePhoto}>
                  <Feather name="camera" size={22} color="#FFFFFF" />
                  <Text style={styles.choiceLabel}>Take Photo</Text>
                </Pressable>

                <Pressable style={[styles.choiceBtn, { backgroundColor: colors.danger }]} onPress={startVideo}>
                  <Feather name="video" size={22} color="#FFFFFF" />
                  <Text style={styles.choiceLabel}>Record Video (Max 3m)</Text>
                </Pressable>

                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelLabel}>Cancel</Text>
                </Pressable>
              </View>
            )}

            {recording && (
              <View style={styles.recordingBar}>
                <View style={styles.recordBadge}>
                  <Text style={styles.recordDot}>🔴</Text>
                  <Text style={styles.recordingText}>
                    {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')} / 3:00
                  </Text>
                </View>
                <Pressable style={styles.stopButton} onPress={stopVideo}>
                  <Text style={styles.stopLabel}>Stop & Save</Text>
                </Pressable>
              </View>
            )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  permissionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center' },
  permissionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  permissionBody: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 16 },
  permissionBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, marginBottom: 8 },
  permissionBtnText: { color: '#fff', fontWeight: 'bold' },
  chooser: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center', gap: spacing.md },
  choiceBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: 999, elevation: 4 },
  choiceLabel: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  cancelBtn: { paddingVertical: spacing.sm },
  cancelLabel: { color: '#FFFFFF', opacity: 0.85, fontSize: 15, fontWeight: '600' },
  recordingBar: { position: 'absolute', bottom: 40, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', padding: spacing.md, borderRadius: 12 },
  recordBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  recordDot: { fontSize: 12 },
  recordingText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  stopButton: { backgroundColor: colors.danger, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  stopLabel: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
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
},
  encryptingText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});