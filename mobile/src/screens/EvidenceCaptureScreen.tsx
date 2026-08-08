import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as Sharing from 'expo-sharing';

export default function EvidenceCaptureScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [recording, setRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  const handleStartRecording = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
    if (!cameraRef.current) return;

    setRecording(true);
    setRecordedUri(null);

    try {
      const video = await cameraRef.current.recordAsync();
      if (video?.uri) {
        setRecordedUri(video.uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Recording failed to complete.');
    } finally {
      setRecording(false);
    }
  };

  const handleStopRecording = () => {
    cameraRef.current?.stopRecording();
  };

  const handlePlayOrShare = async () => {
    if (!recordedUri) return;
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(recordedUri);
    } else {
      Alert.alert('Error', 'Sharing is not available on this device');
    }
  };

  if (!cameraPermission?.granted || !micPermission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera and microphone permissions are required.</Text>
        <TouchableOpacity style={styles.button} onPress={async () => {
          await requestCameraPermission();
          await requestMicPermission();
        }}>
          <Text style={styles.buttonText}>Grant Permissions</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} mode="video" style={styles.tinyCamera} />

      <Text style={styles.statusText}>
        {recording ? '🔴 Recording in progress...' : 'Ready to record'}
      </Text>

      <TouchableOpacity
        style={[styles.button, recording && styles.buttonRecording]}
        onPress={recording ? handleStopRecording : handleStartRecording}
      >
        <Text style={styles.buttonText}>{recording ? 'Stop Recording' : 'Start Recording'}</Text>
      </TouchableOpacity>

      {recordedUri && (
        <TouchableOpacity style={styles.playButton} onPress={handlePlayOrShare}>
          <Text style={styles.playButtonText}>▶ Play / Open Saved Video</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F9FAFB' },
  tinyCamera: { width: 2, height: 2, opacity: 0.01, position: 'absolute' },
  statusText: { fontSize: 18, fontWeight: '600', marginBottom: 24, color: '#111827' },
  button: { backgroundColor: '#6B21A8', borderRadius: 8, padding: 16, paddingHorizontal: 32, marginBottom: 16 },
  buttonRecording: { backgroundColor: '#DC2626' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  playButton: { backgroundColor: '#059669', borderRadius: 8, padding: 14, paddingHorizontal: 24, marginTop: 12 },
  playButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  text: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 16 },
});