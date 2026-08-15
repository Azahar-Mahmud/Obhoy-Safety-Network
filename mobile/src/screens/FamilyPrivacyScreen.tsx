import React, { useEffect, useState } from 'react';
import { View, Text, Switch, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { t, useLanguage } from '../i18n';
import {
  fetchFamilyState, fetchViewers, setSharingPaused, unlinkMember,
} from '../utils/familyLocation';

export default function FamilyPrivacyScreen() {
  useLanguage();
  const [paused, setPaused] = useState(false);
  const [viewers, setViewers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const reload = async () => {
    try {
      const [state, log] = await Promise.all([fetchFamilyState(false), fetchViewers()]);
      setPaused(state.me.sharingPaused);
      setMembers(state.members);
      setViewers(log);
    } catch {
      // leave whatever is on screen
    }
  };

  useEffect(() => { reload(); }, []);

  const togglePause = async (value: boolean) => {
    setPaused(value);
    try {
      await setSharingPaused(value);
    } catch {
      setPaused(!value);
      Alert.alert(t('common.error'));
    }
  };

  const confirmUnlink = (m: any) => {
    Alert.alert(
      t('family.remove_title'),
      t('family.remove_body', { phone: m.phone }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => { await unlinkMember(m.userId); reload(); },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.pauseRow}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.label}>{t('family.pause_label')}</Text>
          <Text style={styles.hint}>{t('family.pause_hint')}</Text>
        </View>
        <Switch value={paused} onValueChange={togglePause} />
      </View>

      <Text style={styles.section}>{t('family.who_viewed')}</Text>
      <Text style={styles.hint}>{t('family.who_viewed_hint')}</Text>
      {viewers.length === 0 ? (
        <Text style={styles.empty}>{t('family.no_views')}</Text>
      ) : (
        viewers.slice(0, 10).map((v, i) => (
          <Text key={i} style={styles.viewRow}>
            {t(v.kind === 'pinged' ? 'family.view_pinged' : 'family.view_opened', {
              phone: v.phone,
              time: new Date(v.at).toLocaleString(),
            })}
          </Text>
        ))
      )}

      <Text style={styles.section}>{t('family.members')}</Text>
      <FlatList
        data={members}
        keyExtractor={(m) => String(m.userId)}
        renderItem={({ item }) => (
          <View style={styles.memberRow}>
            <Text style={styles.name}>{item.phone}</Text>
            <TouchableOpacity onPress={() => confirmUnlink(item)}>
              <Text style={styles.remove}>{t('family.remove')}</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FFFFFF' },
  pauseRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EDE9FE',
  },
  label: { fontSize: 16, color: '#111827' },
  hint: { fontSize: 13, color: '#6B7280', marginTop: 4, lineHeight: 19 },
  section: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginTop: 24 },
  empty: { color: '#6B7280', marginTop: 8 },
  viewRow: { color: '#111827', marginTop: 8, fontSize: 14 },
  memberRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 52, borderBottomWidth: 1, borderBottomColor: '#EDE9FE',
  },
  name: { fontSize: 16, color: '#111827' },
  remove: { color: '#DC2626', fontWeight: 'bold' },
});