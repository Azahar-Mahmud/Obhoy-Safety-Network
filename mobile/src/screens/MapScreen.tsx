import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { broadcastCommunityAlert } from '../utils/communityAlert';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

const CATEGORY_COLORS: Record<string, string> = {
  mugging: '#DC2626',
  harassment: '#DC2626',
  checkpost_harassment: '#DC2626',
  poor_lighting: '#D97706',
  safe_spot: '#16A34A',
};

function getScoreColor(score: number | null) {
  if (score === null) return { backgroundColor: '#9CA3AF' }; 
  if (score >= 4) return { backgroundColor: '#16A34A' };     
  if (score >= 3) return { backgroundColor: '#F59E0B' };     
  return { backgroundColor: '#DC2626' };                      
}

function buildMapHtml(lat: number, lng: number, reports: any[], checkins: any[], alerts: any[]) {
  const reportMarkers = reports.map((r) => {
    const color = CATEGORY_COLORS[r.category] || '#6B7280';
    const ageMs = Date.now() - new Date(r.createdAt).getTime();
    const opacity = Math.max(0.35, 1 - ageMs / (90 * 24 * 60 * 60 * 1000));
    const radius = r.verifiedCount > 0 ? 10 : 6;
    const label = `<b>${r.category.replace(/_/g, ' ')}</b>${r.description ? '<br/>' + r.description : ''}<br/>Confirmed by ${r.verifiedCount}<br/><button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'verify', id:'${r.id}'}))">Confirm this happened</button>`;
    return `L.circleMarker([${r.lat}, ${r.lng}], {radius: ${radius}, color: '${color}', fillColor: '${color}', fillOpacity: ${opacity}}).addTo(map).bindPopup(${JSON.stringify(label)});`;
  }).join('\n');

  const checkinMarkers = checkins.map((c) => {
    const label = `<b>Community Check-in</b><br/>Someone marked themselves safe here recently.`;
    return `
      L.marker([${c.lat}, ${c.lng}], {
        icon: L.divIcon({
          html: '<div style="font-size: 20px; line-height: 20px; text-align: center; text-shadow: 0 0 3px rgba(255,255,255,0.8);">✅</div>',
          className: 'safe-icon',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(map).bindPopup(${JSON.stringify(label)});
    `;
  }).join('\n');

  const alertMarkers = alerts.map((a) => {
    const label = `<b>LIVE ALERT: ${a.category.replace(/_/g, ' ').toUpperCase()}</b><br/>Reported in the last 45 mins.`;
    return `
      L.marker([${a.lat}, ${a.lng}], {
        icon: L.divIcon({
          html: '<div style="font-size: 22px; line-height: 22px; text-align: center; text-shadow: 0 0 3px rgba(255,255,255,0.8);">⚠️</div>',
          className: 'alert-icon',
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        })
      }).addTo(map).bindPopup(${JSON.stringify(label)});
    `;
  }).join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; }
    .safe-icon, .alert-icon { background: transparent; border: none; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([${lat}, ${lng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    ${reportMarkers}
    ${checkinMarkers}
    ${alertMarkers}

    map.on('moveend', function() {
      const center = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'mapMoved', lat: center.lat, lng: center.lng }));
    });
  </script>
</body>
</html>`;
}

export default function MapScreen({ navigation }: Props) {
  useLanguage();
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAlertPicker, setShowAlertPicker] = useState(false);

  const [areaScore, setAreaScore] = useState<{ score: number | null; label: string; reportCount: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchAreaScore = async (lat: number, lng: number) => {
    try {
      const result = await apiRequest(`/reports/area-score?lat=${lat}&lng=${lng}&radius=1`);
      setAreaScore(result);
    } catch {}
  };

  const loadMap = useCallback(async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setLoading(false); return; }
    const { coords } = await Location.getCurrentPositionAsync({});
    
    try {
      const [reports, checkins, alerts] = await Promise.all([
        apiRequest(`/reports/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=5`).catch(() => []),
        apiRequest(`/safety-checkins/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=5`).catch(() => []),
        apiRequest(`/community-alerts/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=5`).catch(() => [])
      ]);
      
      setHtml(buildMapHtml(coords.latitude, coords.longitude, reports, checkins, alerts));
      fetchAreaScore(coords.latitude, coords.longitude);
    } catch {
      setHtml(buildMapHtml(coords.latitude, coords.longitude, [], [], []));
    }
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { loadMap(); }, [loadMap]));

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'verify') {
        await apiRequest(`/reports/${data.id}/verify`, { method: 'POST' }).catch(() => {});
        loadMap();
      } else if (data.type === 'mapMoved') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchAreaScore(data.lat, data.lng), 600);
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      {!loading && html ? (
        <WebView source={{ html }} style={styles.map} originWhitelist={['*']} onMessage={handleMessage} />
      ) : null}

      {areaScore && (
        <View style={[styles.scoreOverlay, getScoreColor(areaScore.score)]}>
          <Text style={styles.scoreText}>
            {areaScore.score !== null ? `${t('map.score_title')}: ${areaScore.score}/5` : t('map.score_no_data')}
          </Text>
          <Text style={styles.scoreLabel}>{areaScore.label}</Text>
        </View>
      )}

      <TouchableOpacity style={styles.warnButton} onPress={() => setShowAlertPicker(true)}>
        <Text style={styles.warnButtonText}>{t('map.warn_nearby')}</Text>
      </TouchableOpacity>

      {showAlertPicker && (
        <View style={styles.pickerOverlay}>
          {(['mugging', 'harassment', 'checkpost_harassment'] as const).map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.pickerOption}
              onPress={async () => {
                setShowAlertPicker(false);
                const result = await broadcastCommunityAlert(category);
                Alert.alert(
                  t('sos.sent_title'),
                  result.channel === 'failed' ? t('sos.channel_failed') : t('report.submitted')
                );
                loadMap();
              }}
            >
              <Text style={styles.pickerOptionText}>{t(`category.${category}` as any)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowAlertPicker(false)}>
            <Text style={styles.pickerCancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.reportButton} onPress={() => navigation.navigate('ReportCategory')}>
        <Text style={styles.reportButtonText}>{t('map.report_button')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  
  scoreOverlay: { 
    position: 'absolute', 
    top: 16, 
    left: 16, 
    right: 16, 
    borderRadius: 8, 
    padding: 10, 
    alignItems: 'center', 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  scoreText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  scoreLabel: { color: '#fff', fontSize: 12, marginTop: 2 },

  warnButton: { 
    position: 'absolute', 
    bottom: 24, 
    right: 16, 
    backgroundColor: '#DC2626', 
    borderRadius: 30, 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    minHeight: 48,
    justifyContent: 'center',
    elevation: 4 
  },
  warnButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  pickerOverlay: { 
    position: 'absolute', 
    bottom: 80, 
    right: 16, 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 8, 
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  pickerOption: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', minHeight: 44, justifyContent: 'center' },
  pickerOptionText: { color: '#111827', fontWeight: '600' },
  pickerCancel: { padding: 12, alignItems: 'center' },
  pickerCancelText: { color: '#6B7280', fontWeight: 'bold' },

  reportButton: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    backgroundColor: '#6B21A8', paddingVertical: 14, paddingHorizontal: 28, minHeight: 48, justifyContent: 'center', borderRadius: 30, elevation: 4,
  },
  reportButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});