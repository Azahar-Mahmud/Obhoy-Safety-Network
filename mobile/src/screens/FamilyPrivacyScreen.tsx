import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { t, useLanguage } from '../i18n';
import {
  fetchFamilyState, fetchViewers, setSharingPaused, unlinkMember,
} from '../utils/familyLocation';

import { ScreenHeader, Card, ListRow, Toggle, Avatar, Button, EmptyState } from '../components';
import { colors, spacing, typography, radii } from '../theme/theme';

export default function FamilyPrivacyScreen() {
  useLanguage();
  const [paused, setPaused] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    try {
      const [state, log] = await Promise.all([fetchFamilyState(false), fetchViewers()]);
      setPaused(state.me.sharingPaused);
      setMembers(state.members);
      setViewers(log);
    } catch {
      // keep current
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const togglePause = async (value: boolean) => {
    setPaused(value);
    try {
      await setSharingPaused(value);
    } catch {
      setPaused(!value);
      Alert.alert(t('common.error') || 'Error', 'Could not update privacy setting.');
    }
  };

  const confirmUnlink = (m: any) => {
    Alert.alert(
      t('family.remove_title') || 'Unlink Family Member',
      t('family.remove_body', { phone: m.name || m.phone }) || `Remove ${m.name || m.phone} from your Family Circle?`,
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Remove',
          style: 'destructive',
          onPress: async () => { await unlinkMember(m.userId); reload(); },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenHeader
        title={t('family.privacy') || 'Family Privacy'}
        subtitle="Manage location visibility and view who has checked your status."
      />

      {/* 1. Global Pause Toggle */}
      <Text style={styles.sectionHeading}>Location Visibility</Text>
      <Card style={styles.card}>
        <ListRow
          title={t('family.pause_label') || 'Pause Location Sharing'}
          subtitle={t('family.pause_hint') || 'Temporarily hide your live location from all family members'}
          left={<Feather name="eye-off" size={20} color={colors.primary} style={styles.rowIcon} />}
          right={<Toggle value={paused} onChange={togglePause} />}
        />
      </Card>

      {/* 2. Connected Members Management */}
      <Text style={styles.sectionHeading}>Manage Connected Members</Text>
      {members.length === 0 ? (
        <EmptyState 
          title="No family members linked" 
          subtitle="When you link with family, you can manage or unlink them here." 
        />
      ) : (
        <Card style={styles.card}>
          {members.map((m, index) => (
            <React.Fragment key={String(m.userId)}>
              <ListRow
                title={m.name || m.phone}
                subtitle="Connected with two-way consent"
                left={<Avatar initial={(m.name || m.phone || '?')[0].toUpperCase()} size={38} />}
                right={
                  <Button
                    label="Unlink"
                    variant="outline"
                    onPress={() => confirmUnlink(m)}
                    style={styles.unlinkBtn}
                  />
                }
              />
              {index < members.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </Card>
      )}

      {/* 3. Access & Viewer Log */}
      <Text style={styles.sectionHeading}>{t('family.who_viewed') || 'Recent View Log'}</Text>
      <Card style={styles.card}>
        <Text style={styles.hint}>
          {t('family.who_viewed_hint') || 'Shows when family members pinged or opened your location:'}
        </Text>
        <View style={styles.divider} />
        {viewers.length === 0 ? (
          <Text style={styles.empty}>{t('family.no_views') || 'No views logged recently.'}</Text>
        ) : (
          viewers.slice(0, 10).map((v, i) => (
            <View key={i} style={styles.viewRow}>
              <Feather 
                name={v.kind === 'pinged' ? 'refresh-cw' : 'eye'} 
                size={14} 
                color={colors.textSecondary} 
                style={{ marginRight: 6 }} 
              />
              <Text style={styles.viewText}>
                {t(v.kind === 'pinged' ? 'family.view_pinged' : 'family.view_opened', {
                  phone: v.phone,
                  time: new Date(v.at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                }) || `${v.phone} viewed at ${new Date(v.at).toLocaleTimeString()}`}
              </Text>
            </View>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionHeading: { ...typography.sectionHeading, fontSize: 15, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.sm },
  card: { padding: spacing.md, marginBottom: spacing.md },
  rowIcon: { marginRight: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  unlinkBtn: { paddingVertical: 4, paddingHorizontal: 12, minHeight: 32 },
  hint: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xs },
  empty: { color: colors.textSecondary, paddingVertical: spacing.sm, fontSize: 13 },
  viewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  viewText: { fontSize: 13, color: colors.textPrimary, flex: 1 },
});