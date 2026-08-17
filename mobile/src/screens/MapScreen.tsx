import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Pressable, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';

import { RootStackParamList } from '../navigation/AppNavigator';
import { apiRequest } from '../api/client';
import { broadcastCommunityAlert, AlertCategory } from '../utils/communityAlert';
import { colors, radii, spacing, typography } from '../theme/theme';
import { t, useLanguage } from '../i18n';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

function getScoreColor(score: number | null) {
  if (score === null) return { backgroundColor: '#9CA3AF' }; 
  if (score >= 4) return { backgroundColor: colors.safe };     
  if (score >= 3) return { backgroundColor: colors.caution };     
  return { backgroundColor: colors.caution }; // Respects red-discipline — caution tone                      
}

// --- STEP 1 & 2: Leaflet HTML Builder with Shape-Coded Pins & Family Pins ---
function buildMapHtml(lat: number, lng: number, reports: any[], checkins: any[], alerts: any[], familyMembers: any[]) {
  // Shape-coded HTML helpers inside Leaflet
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

  // 1. Incident Report Pins (Amber Caution Triangles)
  const reportPins = reports.map((r) => {
    const label = `<b>${r.category.replace(/_/g, ' ').toUpperCase()}</b>${r.description ? '<br/>' + r.description : ''}<br/>Confirmed by ${r.verifiedCount}<br/><button style="margin-top:6px;padding:4px 8px;background:#6B21A8;color:#fff;border:none;border-radius:4px;cursor:pointer;" onclick="window.ReactNativeWebView.postMessage(JSON.stringify({type:'verify', id:'${r.id}'}))">Confirm this happened</button>`;
    return `addCustomMarker(${r.lat}, ${r.lng}, 'caution', '!', ${JSON.stringify(label)});`;
  }).join('\n');

  // 2. Community Safety Check-in Pins (Green Checkmark Circles)
  const checkinPins = checkins.map((c) => {
    const label = `<b>Community Safety Check-in</b><br/>A community member marked themselves safe here.`;
    return `addCustomMarker(${c.lat}, ${c.lng}, 'safe', '', ${JSON.stringify(label)});`;
  }).join('\n');

  // 3. Live Community Alerts (Amber Caution Triangles with urgent label)
  const alertPins = alerts.map((a) => {
    const label = `<b>LIVE ALERT: ${a.category.replace(/_/g, ' ').toUpperCase()}</b><br/>Reported in the last 45 mins.`;
    return `addCustomMarker(${a.lat}, ${a.lng}, 'caution', '!', ${JSON.stringify(label)});`;
  }).join('\n');

  // 4. Family Member Pins (Purple Circles with Initials)
  const familyPins = familyMembers.map((m) => {
    const label = `<b>${m.name || 'Family Member'}</b><br/>Live Location<br/>Last active: ${m.updatedAt ? new Date(m.updatedAt).toLocaleTimeString() : 'Recently'}`;
    return `addCustomMarker(${m.lat}, ${m.lng}, 'family', ${JSON.stringify(m.initial)}, ${JSON.stringify(label)});`;
  }).join('\n');

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
      // Parallel fetch: Reports, Safety Check-ins, Live Alerts, and Family Members
      const [reports, checkins, alerts, familyData] = await Promise.all([
        apiRequest(`/reports/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=5`).catch(() => []),
        apiRequest(`/safety-checkins/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=5`).catch(() => []),
        apiRequest(`/community-alerts/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=5`).catch(() => []),
        apiRequest('/family').catch(() => null)
      ]);

      // Format family members for pins
      const familyMembers = (familyData?.members || [])
        .filter((m: any) => m.location && typeof m.location.lat === 'number')
        .map((m: any) => ({
          name: m.name || m.phone,
          initial: (m.name || m.phone || '?')[0].toUpperCase(),
          lat: m.location.lat,
          lng: m.location.lng,
          updatedAt: m.location.updatedAt,
        }));
      
      setHtml(buildMapHtml(coords.latitude, coords.longitude, reports, checkins, alerts, familyMembers));
      fetchAreaScore(coords.latitude, coords.longitude);
    } catch {
      setHtml(buildMapHtml(coords.latitude, coords.longitude, [], [], [], []));
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

      {/* Floating Area Safety Score Overlay */}
      {areaScore && (
        <View style={[styles.scoreOverlay, getScoreColor(areaScore.score)]}>
          <Text style={styles.scoreText}>
            {areaScore.score !== null ? `Area Safety: ${areaScore.score}/5` : 'Not enough data'}
          </Text>
          <Text style={styles.scoreLabel}>{areaScore.label}</Text>
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
                loadMap(); 
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

      {/* High-Contrast FAB: White Ring Halo + Shadow */}
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
    top: 16, 
    left: 16, 
    right: 16, 
    borderRadius: radii.md, 
    padding: spacing.sm + 2, 
    alignItems: 'center', 
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }
  },
  scoreText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  scoreLabel: { color: '#fff', fontSize: 12, marginTop: 2 },

  // STEP 3: High-Contrast Report FAB
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF', // High-contrast white halo
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },

  warnButton: { 
    position: 'absolute', 
    bottom: 24, 
    left: 16, 
    backgroundColor: colors.caution, // Amber caution instead of red
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
    bottom: 84, 
    left: 16, 
    backgroundColor: '#fff', 
    borderRadius: radii.md, 
    padding: spacing.xs, 
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