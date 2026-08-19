import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator, Alert, Animated } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { Feather } from '@expo/vector-icons';
import { colors, spacing, radii, typography } from '../theme/theme';
import { encryptFile } from '../utils/evidenceCrypto';

const VIDEO_CAP_SECONDS = 180; // 3-minute max

interface EvidenceCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved?: (encryptedPath: string) => void;
}

export function EvidenceCaptureModal({ visible, onClose, onSaved }: EvidenceCaptureModalProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const [mode, setMode] = useState<'photo' | 'video' | 'audio'>('photo');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [encrypting, setEncrypting] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Pulse animation for recording dot
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (recording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [recording]);

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
              android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
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
    if (timerRef.current) clearInterval(timerRef.current);
    setRecording(false);
    setElapsed(0);
  };

  const handleSaveAndClose = async (uri: string) => {
    setEncrypting(true);
    try {
      const encryptedPath = await encryptFile(uri);
      if (onSaved) onSaved(encryptedPath);
      Alert.alert('Secured', 'Evidence encrypted and stored in private vault.');
    } catch (err) {
      Alert.alert('Error', 'Failed to encrypt evidence file.');
    } finally {
      setEncrypting(false);
      cleanup();
      onClose();
    }
  };

  const triggerCapture = async () => {
    if (mode === 'photo') {
      try {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.7 });
        if (photo?.uri) await handleSaveAndClose(photo.uri);
      } catch (err) {
        cleanup(); onClose();
      }
      return;
    }

    // Toggle Video/Audio
    if (!recording) {
      setRecording(true);
      setElapsed(0);
      timerRef.current = setInterval(() => {
        setElapsed((prev) => {
          if (prev + 1 >= VIDEO_CAP_SECONDS) {
            stopCapture();
            return VIDEO_CAP_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);

      try {
        if (mode === 'video') {
          const video = await cameraRef.current?.recordAsync({ maxDuration: VIDEO_CAP_SECONDS });
          if (video?.uri) await handleSaveAndClose(video.uri);
        } else {
          setTimeout(() => stopCapture(), 5000); // mock audio stop for now
        }
      } catch (err) {
        cleanup(); onClose();
      }
    } else {
      stopCapture();
    }
  };

  const stopCapture = () => {
    if (mode === 'video') cameraRef.current?.stopRecording();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cleanup}>
      <View style={styles.container}>
        
        {/* Camera Feed or Audio Blank Screen */}
        {mode === 'audio' ? (
          <View style={styles.audioBg}>
             <Feather name="mic" size={60} color="rgba(255,255,255,0.2)" />
          </View>
        ) : (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            mode={mode === 'video' ? 'video' : 'picture'}
          />
        )}

        {/* Encrypting Overlay */}
        {encrypting && (
          <View style={styles.encryptingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.encryptingText}>Encrypting & Vaulting Evidence...</Text>
          </View>
        )}

        {/* Top Bar */}
        <View style={styles.topBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Animated.View style={[styles.pulseDot, { opacity: recording ? pulseAnim : 0 }]} />
            <Text style={styles.timerText}>
              {recording ? `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}` : 'Ready'}
            </Text>
          </View>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Feather name="x" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Viewfinder Grid */}
        <View style={styles.viewfinder} pointerEvents="none">
          <View style={styles.vfHorizontal} />
          <View style={styles.vfVertical} />
          <Text style={styles.vfHint}>{mode === 'audio' ? 'Audio Only' : mode === 'video' ? 'Video Active' : 'Photo Active'}</Text>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomBar}>
          <View style={styles.segCtrl}>
            <Pressable style={[styles.segBtn, mode === 'photo' && styles.segBtnActive]} onPress={() => !recording && setMode('photo')}>
              <Text style={[styles.segBtnText, mode === 'photo' && { color: '#fff' }]}>Photo</Text>
            </Pressable>
            <Pressable style={[styles.segBtn, mode === 'video' && styles.segBtnActive]} onPress={() => !recording && setMode('video')}>
              <Text style={[styles.segBtnText, mode === 'video' && { color: '#fff' }]}>Video</Text>
            </Pressable>
            <Pressable style={[styles.segBtn, mode === 'audio' && styles.segBtnActive]} onPress={() => !recording && setMode('audio')}>
              <Text style={[styles.segBtnText, mode === 'audio' && { color: '#fff' }]}>Audio</Text>
            </Pressable>
          </View>

          <Pressable 
            style={[
              styles.captureBtn, 
              mode === 'video' && { borderColor: colors.danger },
              mode === 'audio' && { borderColor: colors.primary },
              recording && { borderRadius: 12, backgroundColor: mode === 'video' ? colors.danger : colors.primary }
            ]} 
            onPress={triggerCapture}
          />
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  audioBg: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' },
  
  topBar: { padding: 50, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  pulseDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.danger },
  timerText: { fontFamily: 'monospace', fontSize: 18, color: '#fff', fontWeight: '600' },
  closeBtn: { padding: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },

  viewfinder: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', margin: 20, alignItems: 'center', justifyContent: 'center' },
  vfHorizontal: { position: 'absolute', top: '33%', bottom: '33%', left: 0, right: 0, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  vfVertical: { position: 'absolute', left: '33%', right: '33%', top: 0, bottom: 0, borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  vfHint: { color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  bottomBar: { padding: 20, paddingBottom: 40, alignItems: 'center', gap: 20, zIndex: 10 },
  
  segCtrl: { flexDirection: 'row', backgroundColor: '#222', borderRadius: radii.md, padding: 3, width: '100%', maxWidth: 300 },
  segBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: radii.sm },
  segBtnActive: { backgroundColor: '#444' },
  segBtnText: { fontSize: 13.5, fontWeight: '700', color: '#aaa' },

  captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', borderWidth: 4, borderColor: '#aaa' }, // removed transition here

  permissionModal: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  permissionCard: { backgroundColor: colors.cardBg, borderRadius: radii.card, padding: 24, alignItems: 'center' },
  permissionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 },
  permissionBody: { fontSize: 14, color: colors.text2, textAlign: 'center', marginBottom: 20 },
  permissionBtn: { backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 14, paddingHorizontal: 24, marginBottom: 8, width: '100%', alignItems: 'center' },
  permissionBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  cancelBtn: { paddingVertical: 12 },
  cancelLabel: { color: colors.text2, fontSize: 15, fontWeight: '700' },

  encryptingOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', gap: 16, zIndex: 100 },
  encryptingText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});