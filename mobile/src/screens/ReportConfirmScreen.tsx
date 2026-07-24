import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ReportConfirm'>;

function buildPickerHtml(lat: number, lng: number) {
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
    const map = L.map('map').setView([${lat}, ${lng}], 17);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    const marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);
    marker.on('dragend', function() {
      const pos = marker.getLatLng();
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: pos.lat, lng: pos.lng }));
    });
  </script>
</body>
</html>`;
}

export default function ReportConfirmScreen({ route, navigation }: Props) {
  const { category } = route.params;
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({});
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCoords({ lat, lng });
      setHtml(buildPickerHtml(lat, lng));
    })();
  }, []);

  const handleMessage = (event: any) => {
    try {
      setCoords(JSON.parse(event.nativeEvent.data));
    } catch {}
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirm the location</Text>
      <Text style={styles.subtitle}>Drag the pin if it's not quite right</Text>
      <View style={styles.mapWrap}>
        {html ? <WebView source={{ html }} originWhitelist={['*']} onMessage={handleMessage} /> : null}
      </View>
      <Text style={styles.timestamp}>Reported: {new Date().toLocaleString()}</Text>
      <TouchableOpacity
        style={styles.button}
        disabled={!coords}
        onPress={() => navigation.navigate('ReportDescription', { category, lat: coords!.lat, lng: coords!.lng })}
      >
        <Text style={styles.buttonText}>✓ Confirm</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 12 },
  mapWrap: { flex: 1, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  timestamp: { textAlign: 'center', color: '#6B7280', marginBottom: 16 },
  button: { backgroundColor: '#16A34A', borderRadius: 8, padding: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});