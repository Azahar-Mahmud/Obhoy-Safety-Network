import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

import { ScreenHeader, Button } from '../components';
import { colors, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MapPointPicker'>;

function buildPickerHtml(lat: number, lng: number) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
      attribution: '&copy; OpenStreetMap' 
    }).addTo(map);

    let marker = L.marker([${lat}, ${lng}], { draggable: true }).addTo(map);

    function reportPoint(lat, lng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'POINT_PICKED',
        lat: lat,
        lng: lng
      }));
    }

    // Initial position
    reportPoint(${lat}, ${lng});

    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      reportPoint(e.latlng.lat, e.latlng.lng);
    });

    marker.on('dragend', function(e) {
      const pos = e.target.getLatLng();
      reportPoint(pos.lat, pos.lng);
    });
  </script>
</body>
</html>`;
}

export default function MapPointPickerScreen({ route, navigation }: Props) {
  const { title, initialLat = 23.8103, initialLng = 90.4125, targetField } = route.params;
  const webViewRef = useRef<WebView>(null);
  const [picked, setPicked] = useState<{ lat: number; lng: number }>({ lat: initialLat, lng: initialLng });

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'POINT_PICKED') {
        setPicked({ lat: data.lat, lng: data.lng });
      }
    } catch {}
  };

  const confirmPoint = () => {
    if (!picked) return;
    navigation.navigate('JourneySetup', {
      pickedLat: picked.lat,
      pickedLng: picked.lng,
      targetField,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <ScreenHeader title={title} subtitle="Tap anywhere on the map or drag the pin to select" />
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: buildPickerHtml(initialLat, initialLng) }}
        onMessage={handleMessage}
        style={styles.map}
        originWhitelist={['*']}
      />

      <View style={styles.bottomBar}>
        <View style={styles.coordDisplay}>
          <Text style={styles.coordText}>
            Selected: {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
          </Text>
        </View>
        <Button
          label="Confirm Selection"
          variant="primary"
          onPress={confirmPoint}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerWrap: { padding: spacing.lg, paddingBottom: spacing.sm },
  map: { flex: 1 },
  bottomBar: { 
    padding: spacing.lg, 
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    elevation: 8,
  },
  coordDisplay: { alignItems: 'center' },
  coordText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
});