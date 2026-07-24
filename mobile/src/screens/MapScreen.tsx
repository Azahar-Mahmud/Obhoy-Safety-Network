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

function buildMapHtml(lat: number, lng: number, reports: any[]) {
  const markers = reports.map((r) => {
    const color = CATEGORY_COLORS[r.category] || '#6B7280';
    const ageMs = Date.now() - new Date(r.createdAt).getTime();
    const opacity = Math.max(0.35, 1 - ageMs / (90 * 24 * 60 * 60 * 1000));
    const radius = r.verifiedCount > 0 ? 10 : 6;
    const label = `<b>${r.category.replace(/_/g, ' ')}</b>${r.description ? '<br/>' + r.description : ''}<br/>Confirmed by ${r.verifiedCount}<br/><button onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'verify', id:'${r.id}'}))">Confirm this happened</button>`;
    return `L.circleMarker([${r.lat}, ${r.lng}], {radius: ${radius}, color: '${color}', fillColor: '${color}', fillOpacity: ${opacity}}).addTo(map).bindPopup(${JSON.stringify(label)});`;
  }).join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>html, body, #map { height: 100%; margin: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map').setView([${lat}, ${lng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    ${markers}
  </script>
</body>
</html>`;
}

export default function MapScreen({ navigation }: Props) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMap = useCallback(async () => {
    setLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setLoading(false); return; }
    const { coords } = await Location.getCurrentPositionAsync({});
    try {
      const reports = await apiRequest(`/reports/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=5`);
      setHtml(buildMapHtml(coords.latitude, coords.longitude, reports));
    } catch {
      setHtml(buildMapHtml(coords.latitude, coords.longitude, []));
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