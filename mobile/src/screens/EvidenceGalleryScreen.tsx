import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, Pressable, StyleSheet, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { WebView } from 'react-native-webview'; // <--- Embedded In-App Video Player
import { Feather } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

import { ScreenHeader, EmptyState, Card } from '../components';
import { colors, spacing, typography, radii } from '../theme/theme';
import { listEvidenceSessions, deleteEvidenceSession, EvidenceItem } from '../utils/evidenceStorage';
import { decryptFile } from '../utils/evidenceCrypto';
import { t, useLanguage } from '../i18n';

const RECOMMENDED_MAX = 25;

export default function EvidenceGalleryScreen() {
  useLanguage();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);

  // In-app preview state
  const [previewItem, setPreviewItem] = useState<{ item: EvidenceItem; uri: string } | null>(null);

  const loadItems = async () => {
    setLoading(true);
    const list = await listEvidenceSessions();
    setItems(list);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const getExtension = (type: 'photo' | 'video' | 'audio') => {
    if (type === 'photo') return 'jpg';
    if (type === 'audio') return 'm4a';
    return 'mp4';
  };

  // Open In-App Viewer
  const handleOpenPreview = async (item: EvidenceItem) => {
    setDecryptingId(item.id);
    try {
      const ext = getExtension(item.type);
      const decryptedUri = await decryptFile(item.sessionDir, ext);
      setPreviewItem({ item, uri: decryptedUri });
    } catch (err) {
      console.error('[GALLERY] Decrypt error:', err);
      Alert.alert('Error', 'Failed to decrypt file for preview.');
    } finally {
      setDecryptingId(null);
    }
  };

  // Share File
  const handleShare = async (item: EvidenceItem, explicitUri?: string) => {
    try {
      const ext = getExtension(item.type);
      const uriToShare = explicitUri || (await decryptFile(item.sessionDir, ext));
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uriToShare);
      }
    } catch (err) {
      console.error('[GALLERY] Share error:', err);
      Alert.alert('Error', 'Failed to share file.');
    }
  };

  const handleDelete = (item: EvidenceItem) => {
    Alert.alert(
      'Delete Evidence?',
      'This encrypted file will be permanently removed from your private vault.',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEvidenceSession(item.sessionDir);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
            if (previewItem?.item.id === item.id) {
              setPreviewItem(null);
            }
          },
        },
      ]
    );
  };

  const overLimit = Math.max(0, items.length - RECOMMENDED_MAX);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Evidence Vault" subtitle="0 files stored" />
        <EmptyState 
          title="No evidence stored yet" 
          subtitle="Photos and video recordings captured from Home or SOS alerts will appear here encrypted." 
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <ScreenHeader title="Evidence Vault" subtitle={`${items.length} encrypted item${items.length === 1 ? '' : 's'}`} />
            {overLimit > 0 && (
              <View style={styles.retentionBanner}>
                <Feather name="alert-circle" size={18} color="#B45309" style={{ marginRight: 8 }} />
                <Text style={styles.retentionText}>
                  {overLimit} item{overLimit === 1 ? '' : 's'} over the recommended limit (25). Review and delete items you no longer need.
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => handleOpenPreview(item)}>
            <Card style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={styles.typeIconBox}>
                  {decryptingId === item.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Feather 
                      name={item.type === 'photo' ? 'image' : item.type === 'audio' ? 'mic' : 'video'} 
                      size={24} 
                      color={colors.primary} 
                    />
                  )}
                </View>

                <View style={styles.infoCol}>
                  <Text style={styles.itemType}>
                    {item.type.toUpperCase()} EVIDENCE
                  </Text>
                  <Text style={styles.itemDate}>
                    {new Date(item.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </Text>
                  <Text style={styles.tapToViewText}>Tap to play & view ›</Text>
                </View>

                <View style={styles.actionButtons}>
                  <Pressable 
                    style={styles.iconButton} 
                    onPress={() => handleShare(item)}
                    hitSlop={10}
                  >
                    <Feather name="share-2" size={18} color={colors.primary} />
                  </Pressable>

                  <Pressable 
                    style={styles.iconButton} 
                    onPress={() => handleDelete(item)}
                    hitSlop={10}
                  >
                    <Feather name="trash-2" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />

      {/* --- IN-APP FULL-SCREEN EVIDENCE VIEWER --- */}
      {previewItem && (
        <Modal visible={!!previewItem} animationType="slide" onRequestClose={() => setPreviewItem(null)}>
          <View style={styles.modalContainer}>
            {/* Top Modal Header */}
            <View style={styles.modalHeader}>
              <Pressable style={styles.modalBackBtn} onPress={() => setPreviewItem(null)}>
                <Feather name="arrow-left" size={24} color="#FFFFFF" />
              </Pressable>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>
                  {previewItem.item.type.toUpperCase()} EVIDENCE
                </Text>
                <Text style={styles.modalSub}>
                  {new Date(previewItem.item.createdAt).toLocaleString()}
                </Text>
              </View>

              <Pressable 
                style={styles.modalActionBtn} 
                onPress={() => handleShare(previewItem.item, previewItem.uri)}
              >
                <Feather name="share-2" size={20} color="#FFFFFF" />
              </Pressable>

              <Pressable 
                style={[styles.modalActionBtn, { backgroundColor: colors.danger }]} 
                onPress={() => handleDelete(previewItem.item)}
              >
                <Feather name="trash-2" size={20} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* Direct In-App Media Display */}
            <View style={styles.mediaContainer}>
              {previewItem.item.type === 'photo' ? (
                /* 1. In-App High-Res Photo View */
                <Image
                  source={{ uri: previewItem.uri }}
                  style={styles.fullMedia}
                  resizeMode="contain"
                />
              ) : (
                /* 2. In-App Direct Video/Audio Player */
                <WebView
                  originWhitelist={['*']}
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                        <style>
                          body, html { margin: 0; padding: 0; background: #000; display: flex; align-items: center; justify-content: center; height: 100%; width: 100%; }
                          video { width: 100%; height: 100%; max-height: 100vh; object-fit: contain; }
                        </style>
                      </head>
                      <body>
                        <video controls autoplay playsinline>
                          <source src="${previewItem.uri}" type="video/mp4">
                        </video>
                      </body>
                      </html>
                    `
                  }}
                  style={styles.fullMedia}
                  allowsFullscreenVideo
                  mediaPlaybackRequiresUserAction={false}
                  allowFileAccess
                  allowFileAccessFromFileURLs
                  allowUniversalAccessFromFileURLs
                />
              )}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.lg, paddingBottom: 110 },
  retentionBanner: { 
    flexDirection: 'row', 
    backgroundColor: colors.cautionTint, 
    borderRadius: radii.md, 
    padding: spacing.md, 
    marginBottom: spacing.md,
    alignItems: 'center'
  },
  retentionText: { color: '#B45309', fontSize: 13, fontWeight: '600', flex: 1 },
  itemCard: { marginBottom: spacing.sm, padding: spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  typeIconBox: { 
    width: 46, 
    height: 46, 
    borderRadius: 23, 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: spacing.md
  },
  infoCol: { flex: 1 },
  itemType: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  itemDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  tapToViewText: { fontSize: 11.5, color: colors.primary, fontWeight: '700', marginTop: 4 },
  actionButtons: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  iconButton: { padding: 8 },

  // In-App Viewer Modal
  modalContainer: { flex: 1, backgroundColor: '#000000' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 48,
    paddingBottom: spacing.md,
    backgroundColor: 'rgba(15, 12, 22, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 10,
  },
  modalBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: { fontSize: 14, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  modalSub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  modalActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  mediaContainer: { flex: 1, backgroundColor: '#000000' },
  fullMedia: { flex: 1, width: '100%', height: '100%', backgroundColor: '#000000' },
});