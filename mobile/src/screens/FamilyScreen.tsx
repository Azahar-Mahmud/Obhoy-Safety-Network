import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { t, useLanguage } from '../i18n';
import {
  FamilyState, FamilyMember, fetchFamilyState, pingMember, publishLocation, respondToInvite,
} from '../utils/familyLocation';
import { freshnessOf } from '../utils/freshness';

const POLL_MS = 30000;

function mapHtml(members: FamilyMember[]) {
  const pins = members
    .filter((m) => m.lat !== null && m.lng !== null && freshnessOf(m.lastPublishedAt, m.sharingPaused).show)
    .map((m) => {
      const f = freshnessOf(m.lastPublishedAt, m.sharingPaused);
      return {
        lat: m.lat, lng: m.lng,
        label: m.phone.slice(-4),
        color: m.sosActive ? '#DC2626' : f.color,
        opacity: f.live ? 1 : 0.45,
      };
    });

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var pins = ${JSON.stringify(pins)};
  var map = L.map('map').setView(pins.length ? [pins[0].lat, pins[0].lng] : [23.78, 90.40], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '&copy; OpenStreetMap' }).addTo(map);
  var group = [];
  pins.forEach(function (p) {
    var m = L.circleMarker([p.lat, p.lng], {
      radius: 11, color: p.color, fillColor: p.color,
      fillOpacity: p.opacity, opacity: p.opacity, weight: 3
    }).addTo(map).bindTooltip(p.label, { permanent: true, direction: 'top' });
    group.push(m);
  });
  if (group.length > 1) map.fitBounds(L.featureGroup(group).getBounds().pad(0.25));
</script></body></html>`;
}

export default function FamilyScreen({ navigation }: any) {
  useLanguage();
  const [state, setState] = useState<FamilyState | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<any>(null);

  const load = useCallback(async (opened: boolean) => {
    try {
      setState(await fetchFamilyState(opened));
    } catch {
      // keep whatever was last shown
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(true);
      publishLocation(); // opening the screen refreshes our position
      timer.current = setInterval(() => load(false), POLL_MS);
      return () => clearInterval(timer.current);
    }, [load])
  );

  const onPing = async (m: FamilyMember) => {
    try {
      await pingMember(m.userId);
      Alert.alert(t('family.ping_sent_title'), t('family.ping_sent_body'));
    } catch {
      Alert.alert(t('common.error'));
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#6B21A8" /></View>;
  }

  const members = state?.members ?? [];
  const invites = state?.invites ?? [];

  return (
    <View style={styles.container}>
      {state?.me.sharingPaused && (
        <View style={styles.pausedBanner}>
          <Text style={styles.pausedText}>{t('family.you_are_paused')}</Text>
        </View>
      )}

      <View style={styles.mapWrap}>
        <WebView
          originWhitelist={['*']}
          source={{ html: mapHtml(members) }}
          style={{ flex: 1 }}
        />
      </View>

      <FlatList
        style={styles.list}
        data={members}
        keyExtractor={(m) => String(m.userId)}
        ListHeaderComponent={
          invites.length ? (
            <View style={styles.inviteBox}>
              {invites.map((inv) => (
                <View key={String(inv.id)} style={styles.inviteRow}>
                  <Text style={styles.inviteText}>
                    {t('family.invite_from', { phone: inv.fromPhone })}
                  </Text>
                  <View style={styles.inviteButtons}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={async () => { await respondToInvite(String(inv.id), true); load(false); }}
                    >
                      <Text style={styles.acceptText}>{t('family.accept')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.declineBtn}
                      onPress={async () => { await respondToInvite(String(inv.id), false); load(false); }}
                    >
                      <Text style={styles.declineText}>{t('family.decline')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>{t('family.empty')}</Text>}
        renderItem={({ item }) => {
          const f = freshnessOf(item.lastPublishedAt, item.sharingPaused);
          return (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.phone}</Text>
                <Text style={[styles.freshness, { color: f.color }]}>
                  {item.sosActive ? t('family.sos_active') : f.label}
                  {item.batteryLevel !== null && !item.sharingPaused
                    ? ` · ${item.batteryLevel}%`
                    : ''}
                </Text>
              </View>
              {!item.sharingPaused && (
                <TouchableOpacity style={styles.pingBtn} onPress={() => onPing(item)}>
                  <Text style={styles.pingText}>{t('family.request_update')}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.navigate('FamilyInvite')}>
          <Text style={styles.footerText}>{t('family.add_member')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={() => navigation.navigate('FamilyPrivacy')}>
          <Text style={styles.footerText}>{t('family.privacy')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mapWrap: { height: 260 },
  list: { flex: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#EDE9FE',
    minHeight: 64,
  },
  name: { fontSize: 16, color: '#111827' },
  freshness: { fontSize: 13, marginTop: 2 },
  pingBtn: {
    minHeight: 44, justifyContent: 'center', paddingHorizontal: 14,
    borderRadius: 8, borderWidth: 1, borderColor: '#6B21A8',
  },
  pingText: { color: '#6B21A8', fontWeight: 'bold', fontSize: 13 },
  empty: { padding: 24, color: '#6B7280', textAlign: 'center' },
  pausedBanner: { backgroundColor: '#6B7280', padding: 10 },
  pausedText: { color: '#FFFFFF', textAlign: 'center' },
  inviteBox: { backgroundColor: '#EDE9FE', padding: 12 },
  inviteRow: { marginBottom: 8 },
  inviteText: { color: '#111827', marginBottom: 8 },
  inviteButtons: { flexDirection: 'row' },
  acceptBtn: {
    backgroundColor: '#16A34A', borderRadius: 8,
    minHeight: 44, justifyContent: 'center', paddingHorizontal: 18, marginRight: 10,
  },
  acceptText: { color: '#FFFFFF', fontWeight: 'bold' },
  declineBtn: {
    borderWidth: 1, borderColor: '#6B7280', borderRadius: 8,
    minHeight: 44, justifyContent: 'center', paddingHorizontal: 18,
  },
  declineText: { color: '#6B7280' },
  footer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#EDE9FE' },
  footerBtn: { flex: 1, minHeight: 52, justifyContent: 'center', alignItems: 'center' },
  footerText: { color: '#6B21A8', fontWeight: 'bold' },
});