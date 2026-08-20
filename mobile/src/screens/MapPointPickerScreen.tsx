import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';

import { ScreenHeader, Button } from '../components';
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
    html, body, #map { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', { zoomControl: false }).setView([${lat}, ${lng}], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
      attribution: '&copy; OpenStreetMap' 
    }).addTo(map);

    function reportCenter() {
      const center = map.getCenter();
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'POINT_PICKED',
        lat: center.lat,
        lng: center.lng
      }));
    }

    reportCenter();
    map.on('move', reportCenter);
    map.on('moveend', reportCenter);
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

    if (targetField === 'report') {
      navigation.navigate('ReportCategory', {
        lat: picked.lat,
        lng: picked.lng,
      });
    } else {
      navigation.navigate('JourneySetup', {
        pickedLat: picked.lat,
        pickedLng: picked.lng,
        targetField,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerWrap}>
        <ScreenHeader title={title} subtitle="Pan the map to position the center pin on target location" />
      </View>

      <View style={styles.mapContainer}>
        <WebView
          ref={webViewRef}
          source={{ html: buildPickerHtml(initialLat, initialLng) }}
          onMessage={handleMessage}
          style={styles.map}
          originWhitelist={['*']}
        />

        {/* Center Target Pin */}
        <View style={styles.centerPinWrap} pointerEvents="none">
          <View style={styles.pinShadow} />
          <View style={styles.pinIcon}>
            <Feather name="map-pin" size={36} color={colors.primary} />
          </View>
        </View>
      </View>

      <View style={styles.bottomBar}>
        <View style={styles.coordDisplay}>
          <Text style={styles.coordText}>
            Target: {picked.lat.toFixed(5)}, {picked.lng.toFixed(5)}
          </Text>
        </View>
        <Button
          label="Set This Location"
          variant="primary"
          onPress={confirmPoint}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  headerWrap: { padding: spacing.lg, paddingBottom: spacing.xs },
  mapContainer: { flex: 1, position: 'relative' },
  map: { flex: 1 },
  centerPinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -36 }],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pinIcon: {
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  pinShadow: {
    position: 'absolute',
    bottom: -2,
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bottomBar: { 
    padding: spacing.lg, 
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
    elevation: 8,
  },
  coordDisplay: { alignItems: 'center' },
  coordText: { fontSize: 13, color: colors.textSecondary, fontWeight: '700' },
});