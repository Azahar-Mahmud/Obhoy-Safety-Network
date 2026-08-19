import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Feather } from '@expo/vector-icons';

import { Button } from '../components';
import { colors, spacing, radii } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MapPointPicker'>;

function buildPickerHtml(lat: number, lng: number) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #F7F5FA; }
    .leaflet-tile { filter: sepia(0.2) hue-rotate(240deg) saturate(0.5); }
    
    /* Static Center Crosshair Pin CSS */
    .center-pin {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%); z-index: 1000;
      animation: bounce-drop 1.5s infinite cubic-bezier(0.28, 0.84, 0.42, 1);
      pointer-events: none;
    }
    @keyframes bounce-drop { 0%, 100% { transform: translate(-50%, -100%); } 50% { transform: translate(-50%, calc(-100% - 15px)); } }
  </style>
</head>
<body>
  <div id="map"></div>
  
  <!-- Center Bouncing Pin -->
  <div class="center-pin">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="#6B21A8" stroke="#fff" stroke-width="1.5">
      <path d="M12 21s7-6.6 7-12a7 7 0 0 0-14 0c0 5.4 7 12 7 12Z"/>
      <circle cx="12" cy="9" r="2.5" fill="#fff"/>
    </svg>
  </div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
      attribution: '&copy; OpenStreetMap' 
    }).addTo(map);

    function reportPoint() {
      const center = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'POINT_PICKED',
        lat: center.lat,
        lng: center.lng
      }));
    }

    // Report continuously as user pans
    map.on('moveend', reportPoint);
  </script>
</body>
</html>`;
}

export default function MapPointPickerScreen({ route, navigation }: Props) {
  const { initialLat = 23.8103, initialLng = 90.4125, targetField } = route.params;
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
      
      {/* Floating Top Header */}
      <View style={styles.topCard}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
          <Feather name="x" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Drag map to set location</Text>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: buildPickerHtml(initialLat, initialLng) }}
        onMessage={handleMessage}
        style={styles.map}
        originWhitelist={['*']}
      />

      {/* Floating Bottom Card */}
      <View style={styles.bottomCard}>
        <Text style={styles.hint}>Selected Coordinates</Text>
        <Text style={styles.locationTitle}>
          {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
        </Text>
        <Button label="Confirm Location" onPress={confirmPoint} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  map: { flex: 1 },
  
  topCard: {
    position: 'absolute', top: 50, left: 16, right: 16, zIndex: 10,
    backgroundColor: colors.cardBg, borderRadius: radii.md, padding: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
  },
  topTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: colors.cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 34,
    elevation: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15, shadowOffset: { width: 0, height: -4 }
  },
  hint: { fontSize: 13, color: colors.text2, marginBottom: 4 },
  locationTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 16 },
});