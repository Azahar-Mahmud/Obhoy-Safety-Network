import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

const CATEGORY_COLORS: Record<string, string> = {
  mugging: '#DC2626',
  harassment: '#DC2626',
  checkpost_harassment: '#DC2626',
  poor_lighting: '#D97706',
  safe_spot: '#16A34A',
};

// --- STEP 5: Add checkins parameter to the HTML builder ---
function buildMapHtml(lat: number, lng: number, reports: any[], checkins: any[]) {
  const reportMarkers = reports.map((r) => {
    const color = CATEGORY_COLORS[r.category] || '#6B7280';
    const ageMs = Date.now() - new Date(r.createdAt).getTime();
    const opacity = Math.max(0.35, 1 - ageMs / (90 * 24 * 60 * 60 * 1000));
    const radius = r.verifiedCount > 0 ? 10 : 6;
    const label = `<b>${r.category.replace(/_/g, ' ')}</b>${r.description ? '<br/>' + r.description : ''}<br/>Confirmed by ${r.verifiedCount}<br/><button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'verify', id:'${r.id}'}))">Confirm this happened</button>`;
    return `L.circleMarker([${r.lat}, ${r.lng}], {radius: ${radius}, color: '${color}', fillColor: '${color}', fillOpacity: ${opacity}}).addTo(map).bindPopup(${JSON.stringify(label)});`;
  }).join('\n');

  // New distinct markers for the community safety check-ins
  const checkinMarkers = checkins.map((c) => {
    const label = `<b>Community Check-in</b><br/>Someone marked themselves safe here recently.`;
    // Using a custom divIcon with a green checkmark so it doesn't look like a danger circle
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

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; }
    .safe-icon { background: transparent; border: none; }
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
  </script>
</body>
</html>`;
}
// ----------------------------------------------------------

export default function MapScreen({ navigation }: Props) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMap = useCallback(async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setLoading(false); return; }
    const { coords } = await Location.getCurrentPositionAsync({});
    
    try {
      // --- STEP 5: Fetch both reports and safety check-ins in parallel ---
      const [reports, checkins] = await Promise.all([
        apiRequest(`/reports/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=5`).catch(() => []),
        apiRequest(`/safety-checkins/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=5`).catch(() => [])
      ]);
      
      setHtml(buildMapHtml(coords.latitude, coords.longitude, reports, checkins));
      // -------------------------------------------------------------------
    } catch {
      setHtml(buildMapHtml(coords.latitude, coords.longitude, [], []));
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
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      {!loading && html ? (
        <WebView source={{ html }} style={styles.map} originWhitelist={['*']} onMessage={handleMessage} />
      ) : null}
      <TouchableOpacity style={styles.reportButton} onPress={() => navigation.navigate('ReportCategory')}>
        <Text style={styles.reportButtonText}>+ Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  reportButton: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    backgroundColor: '#6B21A8', paddingVertical: 14, paddingHorizontal: 28, borderRadius: 30, elevation: 4,
  },
  reportButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});