import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';

import { ScreenHeader, EmptyState, Card } from '../components';
import { colors, spacing, typography } from '../theme/theme';
import { listEvidenceSessions, deleteEvidenceSession, EvidenceItem } from '../utils/evidenceStorage';
import { decryptFile } from '../utils/evidenceCrypto';
import { t, useLanguage } from '../i18n';

const RECOMMENDED_MAX = 25;

export default function EvidenceGalleryScreen() {
  useLanguage();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [decryptingId, setDecryptingId] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    const list = await listEvidenceSessions();
    setItems(list);
    setLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleShare = async (item: EvidenceItem) => {
    setDecryptingId(item.id);
    try {
      const decryptedPath = await decryptFile(item.sessionDir);
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(decryptedPath);
      }
    } catch (err) {
      console.error('[GALLERY] Decrypt error:', err);
      Alert.alert('Error', 'Failed to decrypt file.');
    } finally {
      setDecryptingId(null);
    }
  };

  const handleDelete = (item: EvidenceItem) => {
    Alert.alert(
      'Delete Evidence?',
      'This encrypted file will be permanently removed from your device.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteEvidenceSession(item.sessionDir);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
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
          subtitle="Photos, video recordings, and auto-audio captured during emergencies will appear here encrypted." 
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
          <Card style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={styles.typeIconBox}>
                <Feather 
                  name={item.type === 'photo' ? 'image' : item.type === 'audio' ? 'mic' : 'video'} 
                  size={24} 
                  color={colors.primary} 
                />
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.itemType}>
                  {item.type.toUpperCase()} EVIDENCE
                </Text>
                <Text style={styles.itemDate}>
                  {new Date(item.createdAt).toLocaleString()}
                </Text>
              </View>

              <View style={styles.actionButtons}>
                <Pressable 
                  style={styles.iconButton} 
                  onPress={() => handleShare(item)}
                  disabled={decryptingId === item.id}
                >
                  {decryptingId === item.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Feather name="share-2" size={20} color={colors.primary} />
                  )}
                </Pressable>

                <Pressable style={styles.iconButton} onPress={() => handleDelete(item)}>
                  <Feather name="trash-2" size={20} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  retentionBanner: { 
    flexDirection: 'row', 
    backgroundColor: colors.cautionTint, 
    borderRadius: 8, 
    padding: spacing.md, 
    marginBottom: spacing.md,
    alignItems: 'center'
  },
  retentionText: { color: '#B45309', fontSize: 13, fontWeight: '600', flex: 1 },
  itemCard: { marginBottom: spacing.sm, padding: spacing.md },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  typeIconBox: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: colors.primaryLight, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: spacing.md
  },
  infoCol: { flex: 1 },
  itemType: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  itemDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  actionButtons: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  iconButton: { padding: 8 },
});