import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

import { colors, spacing, typography, radii } from '../theme/theme';
import { listEvidenceSessions, deleteEvidenceSession, EvidenceItem } from '../utils/evidenceStorage';
import { decryptFile } from '../utils/evidenceCrypto';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'EvidenceGallery'>;
const RECOMMENDED_MAX = 25;

export default function EvidenceGalleryScreen({ navigation }: Props) {
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

  useEffect(() => { loadItems(); }, []);

  const handleShare = async (item: EvidenceItem) => {
    setDecryptingId(item.id);
    try {
      const decryptedPath = await decryptFile(item.sessionDir);
      const available = await Sharing.isAvailableAsync();
      if (available) await Sharing.shareAsync(decryptedPath);
    } catch (err) {
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
        { text: 'Delete', style: 'destructive', onPress: async () => {
            await deleteEvidenceSession(item.sessionDir);
            setItems((prev) => prev.filter((i) => i.id !== item.id));
          },
        },
      ]
    );
  };

  const overLimit = Math.max(0, items.length - RECOMMENDED_MAX);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.subHeader}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={colors.text} />
        </Pressable>
        <Text style={typography.screenTitle}>Evidence Vault</Text>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.hint}>Files stored securely inside the app. They will not appear in your phone's main photo gallery.</Text>
            {overLimit > 0 && (
              <View style={styles.retentionBanner}>
                <Feather name="alert-circle" size={18} color="#B45309" style={{ marginRight: 8 }} />
                <Text style={styles.retentionText}>{overLimit} items over recommended limit. Consider deleting old files.</Text>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.text2, marginTop: 40 }}>0 files stored securely.</Text>}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemRow}>
              <View style={styles.typeIconBox}>
                <Feather name={item.type === 'photo' ? 'image' : item.type === 'audio' ? 'mic' : 'video'} size={20} color={colors.text} />
              </View>

              <View style={styles.infoCol}>
                <Text style={styles.itemType}>Auto-SOS {item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
                <Text style={styles.itemDate}>{new Date(item.createdAt).toLocaleString()} · Encrypted</Text>
              </View>

              <View style={styles.actionButtons}>
                <Pressable style={styles.iconButton} onPress={() => handleShare(item)} disabled={decryptingId === item.id}>
                  {decryptingId === item.id ? <ActivityIndicator size="small" color={colors.text2} /> : <Feather name="share-2" size={20} color={colors.text2} />}
                </Pressable>
                <Pressable style={styles.iconButton} onPress={() => handleDelete(item)}>
                  <Feather name="trash-2" size={20} color={colors.danger} />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  subHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xl, marginTop: 40, marginBottom: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardBg },
  listContent: { padding: spacing.xl, paddingBottom: spacing.xxl },
  hint: { fontSize: 13, color: colors.text2, lineHeight: 18 },
  
  retentionBanner: { flexDirection: 'row', backgroundColor: colors.cautionTint, borderRadius: radii.sm, padding: spacing.md, marginTop: spacing.md, alignItems: 'center' },
  retentionText: { color: '#B45309', fontSize: 13, fontWeight: '600', flex: 1 },
  
  itemCard: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, borderRadius: radii.card, padding: 16, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  typeIconBox: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.inputBg, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  infoCol: { flex: 1 },
  itemType: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  itemDate: { fontSize: 13, color: colors.text2, marginTop: 2 },
  actionButtons: { flexDirection: 'row', alignItems: 'center' },
  iconButton: { padding: 8, marginLeft: 4 },
});