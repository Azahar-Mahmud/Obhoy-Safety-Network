import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Pressable, Alert, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { broadcastCommunityAlert, AlertCategory } from '../utils/communityAlert';
import { getRoute } from '../utils/journeyRouting';
import { colors, radii, spacing } from '../theme/theme';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

function getScoreColor(score: number | null) {
  if (score === null) return { backgroundColor: '#9CA3AF' }; 
  if (score >= 4) return { backgroundColor: colors.safe };     
  return { backgroundColor: colors.caution };                      
}

function buildMapHtml(
  lat: number, 
  lng: number, 
  reports: any[], 
  checkins: any[], 
  alerts: any[], 
  familyMembers: any[],
  routePoints: any[] = []
) {
  const markersScript = `
    function pinIconHtml(kind, letter) {
      if (kind === 'safe') {
        return '<div style="width:28px;height:28px;border-radius:50%;background:#16A34A;border:2px solid #fff;' +
          'display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35);">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M4 12.5l5 5L20 6.5"/></svg>' +
        '</div>';
      }
      if (kind === 'caution') {
        return '<div style="width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;' +
          'border-bottom:24px solid #D97706;position:relative;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));">' +
          '<span style="position:absolute;top:7px;left:-3.5px;color:#fff;font-weight:900;font-size:13px;font-family:sans-serif;">!</span>' +
        '</div>';
      }
      if (kind === 'family') {
        return '<div style="width:30px;height:30px;border-radius:50%;background:#6B21A8;border:2px solid #fff;' +
          'display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.35);">' +
          '<span style="color:#fff;font-weight:800;font-size:13px;font-family:sans-serif;">' + (letter || '?') + '</span>' +
        '</div>';
      }
    }

    function addCustomMarker(lat, lng, kind, letter, popupHtml) {
      const icon = L.divIcon({
        html: pinIconHtml(kind, letter),
        className: '', 
        iconSize: kind === 'caution' ? [28, 24] : [30, 30],
        iconAnchor: kind === 'caution' ? [14, 24] : [15, 15]
      });
      L.marker([lat, lng], { icon }).addTo(map).bindPopup(popupHtml);
    }
  `;

  const reportPins = reports.map((r) => {
    const label = `<b>${r.category.replace(/_/g, ' ').toUpperCase()}</b>${r.description ? '<br/>' + r.description : ''}<br/>Confirmed by ${r.verifiedCount}<br/><button style="margin-top:6px;padding:4px 8px;background:#6B21A8;color:#fff;border:none;border-radius:4px;cursor:pointer;" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'verify', id:'${r.id}'}))">Confirm this happened</button>`;
    return `addCustomMarker(${r.lat}, ${r.lng}, 'caution', '!', ${JSON.stringify(label)});`;
  }).join('\n');

  const checkinPins = checkins.map((c) => {
    const label = `<b>Community Safety Check-in</b><br/>A community member marked themselves safe here.`;
    return `addCustomMarker(${c.lat}, ${c.lng}, 'safe', '', ${JSON.stringify(label)});`;
  }).join('\n');

  const alertPins = alerts.map((a) => {
    const label = `<b>LIVE ALERT: ${a.category.replace(/_/g, ' ').toUpperCase()}</b><br/>Reported in the last 45 mins.`;
    return `addCustomMarker(${a.lat}, ${a.lng}, 'caution', '!', ${JSON.stringify(label)});`;
  }).join('\n');

  const familyPins = familyMembers.map((m) => {
    const label = `<b>${m.name || m.phone || 'Family'}</b><br/>Live Location<br/>Last active: ${m.updatedAt ? new Date(m.updatedAt).toLocaleTimeString() : 'Recently'}`;
    return `addCustomMarker(${m.lat}, ${m.lng}, 'family', ${JSON.stringify(m.initial)}, ${JSON.stringify(label)});`;
  }).join('\n');

  const routePolylineScript = routePoints.length >= 2 ? `
    const routeCoords = ${JSON.stringify(routePoints.map(p => [p.lat, p.lng]))};
    L.polyline(routeCoords, { color: '#6B21A8', weight: 4, opacity: 0.75 }).addTo(map);
    L.marker(routeCoords[routeCoords.length - 1]).addTo(map).bindPopup('<b>Destination</b>');
  ` : '';

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

    ${markersScript}
    ${reportPins}
    ${checkinPins}
    ${alertPins}
    ${familyPins}
    ${routePolylineScript}

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
  const insets = useSafeAreaInsets();
  const [coords, setCoords] = useState<{ latitude: number; longitude: number }>({ latitude: 23.8103, longitude: 90.4125 });
  const [html, setHtml] = useState(buildMapHtml(23.8103, 90.4125, [], [], [], [], []));
  const [showAlertPicker, setShowAlertPicker] = useState(false);
  const [areaScore, setAreaScore] = useState<{ score: number | null; label: string; reportCount: number } | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Status bar clearance offset
  const topOverlayOffset = Platform.OS === 'android' 
    ? Math.max(insets.top, (StatusBar.currentHeight || 28)) + 12
    : Math.max(insets.top, 24);

  const fetchAreaScore = async (lat: number, lng: number) => {
    try {
      const result = await apiRequest(`/reports/area-score?lat=${lat}&lng=${lng}&radius=1`);
      setAreaScore(result);
    } catch {}
  };

  const loadMapData = useCallback(async (targetLat: number, targetLng: number) => {
    fetchAreaScore(targetLat, targetLng);

    try {
      const [reports, checkins, alerts, familyData, activeJourney] = await Promise.all([
        apiRequest(`/reports/nearby?lat=${targetLat}&lng=${targetLng}&radius=5`).catch(() => []),
        apiRequest(`/safety-checkins/nearby?lat=${targetLat}&lng=${targetLng}&radius=5`).catch(() => []),
        apiRequest(`/community-alerts/nearby?lat=${targetLat}&lng=${targetLng}&radius=5`).catch(() => []),
        apiRequest('/family').catch(() => null),
        apiRequest('/journey/active').catch(() => null),
      ]);

      const familyMembers = (familyData?.members || [])
        .filter((m: any) => m.location && typeof m.location.lat === 'number')
        .map((m: any) => ({
          name: m.name || m.phone,
          initial: (m.name || m.phone || '?')[0].toUpperCase(),
          lat: m.location.lat,
          lng: m.location.lng,
          updatedAt: m.location.updatedAt,
        }));

      let routePoints: any[] = [];
      if (
        activeJourney && 
        typeof activeJourney.destinationLat === 'number' && 
        typeof activeJourney.destinationLng === 'number'
      ) {
        const start = {
          lat: activeJourney.originLat || activeJourney.currentLocation?.lat || targetLat,
          lng: activeJourney.originLng || activeJourney.currentLocation?.lng || targetLng,
        };
        const dest = {
          lat: activeJourney.destinationLat,
          lng: activeJourney.destinationLng,
        };
        routePoints = await getRoute(start, dest);
      }

      setHtml(buildMapHtml(targetLat, targetLng, reports, checkins, alerts, familyMembers, routePoints));
    } catch {}
  }, []);

  useFocusEffect(
    useCallback(() => {
      Location.getLastKnownPositionAsync()
        .then((last) => {
          if (last) {
            setCoords(last.coords);
            loadMapData(last.coords.latitude, last.coords.longitude);
          } else {
            loadMapData(23.8103, 90.4125);
          }
        })
        .catch(() => loadMapData(23.8103, 90.4125));

      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        .then((fresh) => {
          if (fresh) {
            setCoords(fresh.coords);
            loadMapData(fresh.coords.latitude, fresh.coords.longitude);
          }
        })
        .catch(() => {});
    }, [loadMapData])
  );

  const handleMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'verify') {
        await apiRequest(`/reports/${data.id}/verify`, { method: 'POST' }).catch(() => {});
        loadMapData(coords.latitude, coords.longitude);
      } else if (data.type === 'mapMoved') {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchAreaScore(data.lat, data.lng), 600);
      }
    } catch {}
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <WebView 
        source={{ html }} 
        style={styles.map} 
        originWhitelist={['*']} 
        onMessage={handleMessage} 
      />

      {/* Floating Area Safety Score Overlay (Safely Offset Below Status Bar) */}
      {areaScore && (
        <View style={[styles.scoreOverlay, getScoreColor(areaScore.score), { top: topOverlayOffset }]}>
          <Text style={styles.scoreLabelPrimary}>{areaScore.label}</Text>
          {areaScore.score !== null && (
            <Text style={styles.scoreNumberSecondary}>
              {areaScore.score}/5 · {areaScore.reportCount} report{areaScore.reportCount === 1 ? '' : 's'}
            </Text>
          )}
        </View>
      )}

      {/* Live Community Alert Trigger */}
      <TouchableOpacity style={styles.warnButton} onPress={() => setShowAlertPicker(true)}>
        <Feather name="radio" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.warnButtonText}>Warn Nearby</Text>
      </TouchableOpacity>

      {/* 3-Category Alert Picker */}
      {showAlertPicker && (
        <View style={styles.pickerOverlay}>
          <Text style={styles.disclaimer}>
            Alerts everyone within about 2km. Does NOT contact police — for emergencies, use SOS or call 999.
          </Text>
          
          {(['mugging', 'harassment', 'checkpost_harassment'] as AlertCategory[]).map((category) => (
            <TouchableOpacity
              key={category}
              style={styles.pickerOption}
              onPress={async () => {
                setShowAlertPicker(false);
                const result = await broadcastCommunityAlert(category);
                Alert.alert(
                  'Sent',
                  result.channel === 'failed' ? 'Could not broadcast right now.' : 'Nearby users warned.'
                );
                loadMapData(coords.latitude, coords.longitude); 
              }}
            >
              <Text style={styles.pickerOptionText}>{category.replace(/_/g, ' ')}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.pickerCancel} onPress={() => setShowAlertPicker(false)}>
            <Text style={styles.pickerCancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* High-Contrast FAB */}
      <Pressable style={styles.fab} onPress={() => navigation.navigate('ReportCategory')}>
        <Feather name="plus" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  map: { flex: 1 },
  scoreOverlay: { 
    position: 'absolute', 
    left: 16, 
    right: 16, 
    borderRadius: radii.card, 
    padding: spacing.md, 
    alignItems: 'center', 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  scoreLabelPrimary: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  scoreNumberSecondary: { fontSize: 12, color: '#FFFFFF', opacity: 0.9, marginTop: 2, textAlign: 'center' },
  disclaimer: { 
    fontSize: 12, 
    color: colors.textSecondary, 
    textAlign: 'center', 
    marginBottom: spacing.xs, 
    paddingHorizontal: 4, 
    lineHeight: 16 
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 90, // Raised above the floating bottom bar
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  warnButton: { 
    position: 'absolute', 
    bottom: 90, // Raised above the floating bottom bar
    left: 16, 
    backgroundColor: colors.caution,
    borderRadius: radii.pill, 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  warnButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  pickerOverlay: { 
    position: 'absolute', 
    bottom: 150, 
    left: 16, 
    right: 16,
    backgroundColor: '#fff', 
    borderRadius: radii.card, 
    padding: spacing.md, 
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 }
  },
  pickerOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  pickerOptionText: { color: colors.textPrimary, textTransform: 'capitalize', fontWeight: '600', fontSize: 14 },
  pickerCancel: { padding: 10, alignItems: 'center' },
  pickerCancelText: { color: colors.textSecondary, fontWeight: 'bold' },
});