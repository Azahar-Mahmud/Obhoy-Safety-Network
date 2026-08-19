import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Alert, ActivityIndicator, Pressable,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { t, useLanguage } from '../i18n';
import {
  FamilyState, FamilyMember, fetchFamilyState, pingMember, publishLocation, respondToInvite,
} from '../utils/familyLocation';
import { freshnessOf } from '../utils/freshness';

import { ScreenHeader, Card, Button, Avatar, EmptyState } from '../components';
import { colors, radii, spacing, typography } from '../theme/theme';

const POLL_MS = 30000;

function mapHtml(members: FamilyMember[]) {
  const pins = members
    .filter((m) => m.lat !== null && m.lng !== null && freshnessOf(m.lastPublishedAt, m.sharingPaused).show)
    .map((m) => {
      const f = freshnessOf(m.lastPublishedAt, m.sharingPaused);
      return {
        lat: m.lat, lng: m.lng,
        label: m.phone.slice(-4),
        color: m.sosActive ? '#DC2626' : '#6B21A8',
        opacity: f.live ? 1 : 0.6,
      };
    });

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0;}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var pins = ${JSON.stringify(pins)};
  var map = L.map('map', { zoomControl: false }).setView(pins.length ? [pins[0].lat, pins[0].lng] : [23.8103, 90.4125], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '&copy; OpenStreetMap' }).addTo(map);
  
  var group = [];
  pins.forEach(function (p) {
    var iconHtml = '<div style="width:28px;height:28px;border-radius:50%;background:'+p.color+';border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,0.3);">' + p.label + '</div>';
    var icon = L.divIcon({ html: iconHtml, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
    var m = L.marker([p.lat, p.lng], { icon: icon }).addTo(map);
    group.push(m);
  });
  if (group.length > 1) map.fitBounds(L.featureGroup(group).getBounds().pad(0.2));
</script></body></html>`;
}

export default function FamilyScreen({ navigation }: any) {
  useLanguage();
  const [state, setState] = useState<FamilyState | null>(null);
  const [loading, setLoading] = useState(true);
  const [pingingId, setPingingId] = useState<string | null>(null);
  const timer = useRef<any>(null);

  const load = useCallback(async (opened: boolean) => {
    try {
      setState(await fetchFamilyState(opened));
    } catch {
      // keep cached
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);
      publishLocation(); // refresh GPS fix on screen focus
      timer.current = setInterval(() => load(false), POLL_MS);
      return () => clearInterval(timer.current);
    }, [load])
  );

  const onPing = async (m: FamilyMember) => {
    setPingingId(String(m.userId));
    try {
      await pingMember(m.userId);
      Alert.alert(t('family.ping_sent_title') || 'Ping Sent', t('family.ping_sent_body') || 'A request was sent to update location.');
    } catch {
      Alert.alert(t('common.error') || 'Error', 'Could not request location update.');
    } finally {
      setPingingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const members = state?.members ?? [];
  const invites = state?.invites ?? [];

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={(m) => String(m.userId)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View>
            {/* 1. Header with Invite and Privacy Links */}
            <ScreenHeader
              title={t('family.title') || 'Family Circle'}
              subtitle="Two-way mutual location sharing & battery status"
              right={
                <View style={styles.headerRightGroup}>
                  <Button
                    label="+ Invite"
                    variant="primary"
                    style={styles.inviteHeaderBtn}
                    onPress={() => navigation.navigate('FamilyInvite')}
                  />
                  <Pressable style={styles.privacyIconBtn} onPress={() => navigation.navigate('FamilyPrivacy')}>
                    <Feather name="settings" size={20} color={colors.textSecondary} />
                  </Pressable>
                </View>
              }
            />

            {/* 2. Paused Banner if Sharing is Paused */}
            {state?.me.sharingPaused && (
              <View style={styles.pausedBanner}>
                <Feather name="eye-off" size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.pausedText}>
                  {t('family.you_are_paused') || 'Your location sharing is paused. Family sees you as offline.'}
                </Text>
              </View>
            )}

            {/* 3. Interactive Mini Map */}
            <Card style={styles.mapCard}>
              <View style={styles.mapWrap}>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: mapHtml(members) }}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>

            {/* 4. Pending Incoming Invites */}
            {invites.length > 0 && (
              <Card style={styles.inviteCard}>
                <Text style={styles.sectionHeading}>Pending Invites ({invites.length})</Text>
                {invites.map((inv) => (
                  <View key={String(inv.id)} style={styles.inviteRow}>
                    <Text style={styles.inviteText}>
                      {t('family.invite_from', { phone: inv.fromPhone }) || `Invite from ${inv.fromPhone}`}
                    </Text>
                    <View style={styles.inviteButtons}>
                      <Button
                        label={t('family.accept') || 'Accept'}
                        variant="safe"
                        style={styles.invActionBtn}
                        onPress={async () => { await respondToInvite(String(inv.id), true); load(false); }}
                      />
                      <Button
                        label={t('family.decline') || 'Decline'}
                        variant="outline"
                        style={styles.invActionBtn}
                        onPress={async () => { await respondToInvite(String(inv.id), false); load(false); }}
                      />
                    </View>
                  </View>
                ))}
              </Card>
            )}

            <Text style={styles.sectionHeading}>
              Connected Members ({members.length})
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={t('family.empty') || 'No family members connected'}
            subtitle="Invite family members with mutual consent to check on each other's live safety and battery levels."
          />
        }
        renderItem={({ item }) => {
          const f = freshnessOf(item.lastPublishedAt, item.sharingPaused);
          const initial = item.phone.slice(-2);

          return (
            <Card style={styles.memberCard}>
              <View style={styles.memberHeaderRow}>
                <View style={styles.memberInfo}>
                  <Avatar initial={initial} size={48} />
                  <View style={{ marginLeft: spacing.md, flex: 1 }}>
                    <Text style={styles.memberName}>{item.phone}</Text>
                    <Text style={[styles.freshnessText, { color: f.color }]}>
                      {item.sosActive ? t('family.sos_active') : f.label}
                    </Text>
                  </View>
                </View>

                {item.batteryLevel !== null && !item.sharingPaused && (
                  <View style={styles.batteryPill}>
                    <Feather 
                      name={item.batteryLevel <= 15 ? 'battery-charging' : 'battery'} 
                      size={14} 
                      color={item.batteryLevel <= 15 ? colors.danger : colors.primary} 
                    />
                    <Text style={[styles.batteryText, item.batteryLevel <= 15 && { color: colors.danger }]}>
                      {item.batteryLevel}%
                    </Text>
                  </View>
                )}
              </View>

              {!item.sharingPaused && (
                <View style={styles.cardActions}>
                  <Button
                    label={pingingId === String(item.userId) ? 'Pinging...' : (t('family.request_update') || 'Request Update')}
                    variant="outline"
                    onPress={() => onPing(item)}
                    disabled={pingingId === String(item.userId)}
                    style={styles.actionBtn}
                  />
                  <Button
                    label="View on Map"
                    variant="primary"
                    onPress={() => navigation.navigate('Map')}
                    style={styles.actionBtn}
                  />
                </View>
              )}
            </Card>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRightGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inviteHeaderBtn: { paddingVertical: 6, paddingHorizontal: 12, minHeight: 36, borderRadius: radii.pill },
  privacyIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  pausedBanner: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#4B5563', 
    padding: spacing.md, 
    borderRadius: radii.md, 
    marginBottom: spacing.md 
  },
  pausedText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', flex: 1 },
  mapCard: { padding: 0, overflow: 'hidden', height: 200, marginBottom: spacing.md },
  mapWrap: { flex: 1 },
  sectionHeading: { ...typography.sectionHeading, fontSize: 15, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.xs },
  inviteCard: { backgroundColor: colors.primaryLight, borderColor: colors.primary, padding: spacing.md, marginBottom: spacing.md },
  inviteRow: { marginBottom: spacing.sm },
  inviteText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  inviteButtons: { flexDirection: 'row', gap: 8 },
  invActionBtn: { flex: 1, minHeight: 36, paddingVertical: 6 },
  memberCard: { padding: spacing.md, marginBottom: spacing.sm },
  memberHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  memberInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  memberName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  freshnessText: { fontSize: 13, marginTop: 2, fontWeight: '500' },
  batteryPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: colors.primaryLight, 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 6 
  },
  batteryText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: spacing.md, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
  actionBtn: { flex: 1, minHeight: 38, paddingVertical: 6 },
});