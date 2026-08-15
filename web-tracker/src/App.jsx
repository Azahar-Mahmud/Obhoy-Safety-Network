import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = 'https://obhoy-safety-network.onrender.com';

const STRINGS = {
  en: {
    sos: '🔴 SOS Active — last updated {{time}}',
    sos_resolved: '✅ Resolved',
    journey: '🟠 On the way to {{destination}} — last updated {{time}}',
    scheduled_active: '🟣 Checking in by {{time}}',
    evidence: '⏺ Recording in progress — last updated {{time}}',
    arrived: '✅ Arrived safely',
    missed: '🔴 Missed a check-in — contacts alerted',
    scheduled_missed: '🔴 Missed scheduled check-in — contacts alerted',
    outside: '🔴 Outside safe zone — last updated {{time}}',
    inside: '🟣 Inside safe zone — last updated {{time}}',
    confirmed: '✅ Confirmed safe',
    requested_help: '🔴 Requested help (Escalated via SMS)',
    ask_safe: "Ask if they're safe",
    asked: 'Request sent — waiting for reply',
    last_known: 'Last known location',
    no_location: 'No location available yet.',
    loading: 'Loading...',
    not_found: 'Link not found or expired.',
  },
  bn: {
    sos: '🔴 SOS সক্রিয় — সর্বশেষ আপডেট {{time}}',
    sos_resolved: '✅ সমাধান হয়েছে',
    journey: '🟠 {{destination}}-এর পথে আছে — সর্বশেষ আপডেট {{time}}',
    scheduled_active: '🟣 নিরাপদ থাকার সময়সীমা {{time}}',
    evidence: '⏺ রেকর্ডিং চলছে — সর্বশেষ আপডেট {{time}}',
    arrived: '✅ নিরাপদে পৌঁছেছে',
    missed: '🔴 সময়মতো খবর দেয়নি — পরিচিতিদের জানানো হয়েছে',
    scheduled_missed: '🔴 নির্ধারিত সময়ে নিরাপদ থাকার খবর দেয়নি — পরিচিতিদের জানানো হয়েছে',
    outside: '🔴 নিরাপদ এলাকার বাইরে — সর্বশেষ আপডেট {{time}}',
    inside: '🟣 নিরাপদ এলাকার ভেতরে — সর্বশেষ আপডেট {{time}}',
    confirmed: '✅ নিরাপদ আছে জানিয়েছে',
    requested_help: '🔴 সাহায্য চেয়েছে (এসএমএসে জানানো হয়েছে)',
    ask_safe: 'নিরাপদ আছে কিনা জিজ্ঞেস করুন',
    asked: 'জিজ্ঞেস করা হয়েছে — উত্তরের অপেক্ষায়',
    last_known: 'সর্বশেষ প্রাপ্ত অবস্থান',
    no_location: 'এখনো কোনো অবস্থান পাওয়া যায়নি।',
    loading: 'লোড হচ্ছে...',
    not_found: 'লিংকটি পাওয়া যায়নি বা মেয়াদ শেষ হয়েছে।',
  },
};

function tr(lang, key, vars = {}) {
  const table = STRINGS[lang === 'bn' ? 'bn' : 'en'];
  let out = (table && table[key]) || (STRINGS.en && STRINGS.en[key]) || key;
  for (const [name, value] of Object.entries(vars)) {
    out = out.split(`{{${name}}}`).join(String(value));
  }
  return out;
}

function getTokenFromUrl() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const token = getTokenFromUrl();

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`${API_BASE_URL}/track/${token}`);
        if (!res.ok) throw new Error('Link not found or expired.');
        setData(await res.json());
      } catch (err) {
        setError(err.message);
      }
    }
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const handleRequestCheckin = async () => {
    setRequesting(true);
    try {
      await fetch(`${API_BASE_URL}/track/${token}/request-checkin`, { method: 'POST' });
      setRequestSent(true);
      setTimeout(() => setRequestSent(false), 120000); 
    } catch {}
    setRequesting(false);
  };

  const lang = data?.language || 'en';

  if (error) return <div style={styles.center}>{tr(lang, 'not_found')}</div>;
  if (!data) return <div style={styles.center}>{tr(lang, 'loading')}</div>;

  const { location, status, updatedAt, kind, destinationLabel, geofence, lastTwoWayResponse, mode, scheduledDeadline } = data;
  const timeStr = updatedAt ? new Date(updatedAt).toLocaleTimeString() : '';
  const deadlineStr = scheduledDeadline ? new Date(scheduledDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  let bannerText = '';
  if (kind === 'sos') {
    bannerText = status === 'active' ? tr(lang, 'sos', { time: timeStr }) : tr(lang, 'sos_resolved');
  } else if (kind === 'evidence') {
    bannerText = tr(lang, 'evidence', { time: timeStr });
  } else if (mode === 'scheduled') {
    if (status === 'active') {
      bannerText = tr(lang, 'scheduled_active', { time: deadlineStr });
    } else if (status === 'arrived') {
      bannerText = tr(lang, 'confirmed');
    } else {
      bannerText = tr(lang, 'scheduled_missed');
    }
  } else {
    if (status === 'active') {
      if (geofence?.alerted) {
        bannerText = tr(lang, 'outside', { time: timeStr });
      } else if (geofence) {
        bannerText = tr(lang, 'inside', { time: timeStr });
      } else {
        bannerText = tr(lang, 'journey', { destination: destinationLabel || (lang === 'bn' ? 'গন্তব্য' : 'destination'), time: timeStr });
      }
    } else if (status === 'arrived') {
      bannerText = tr(lang, 'arrived');
    } else {
      bannerText = tr(lang, 'missed');
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.banner}>{bannerText}</div>
      
      {kind === 'journey' && status === 'active' && (
        <button 
          onClick={handleRequestCheckin} 
          disabled={requesting || requestSent} 
          style={{...styles.checkinButton, opacity: (requesting || requestSent) ? 0.6 : 1 }}
        >
          {requestSent ? tr(lang, 'asked') : tr(lang, 'ask_safe')}
        </button>
      )}
      {lastTwoWayResponse === 'safe' && <div style={styles.safeNote}>{tr(lang, 'confirmed')}</div>}
      {lastTwoWayResponse === 'help' && <div style={styles.helpNote}>{tr(lang, 'requested_help')}</div>}

      {location ? (
        <MapContainer center={[location.lat, location.lng]} zoom={16} style={styles.map}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          
          {geofence && (
            <Circle 
              center={[geofence.center.lat, geofence.center.lng]} 
              radius={geofence.radiusMeters} 
              pathOptions={{
                color: geofence.alerted ? '#DC2626' : '#6B21A8',
                fillOpacity: 0.08
              }}
            />
          )}
          
          <Marker position={[location.lat, location.lng]}>
            <Popup>{tr(lang, 'last_known')}</Popup>
          </Marker>
        </MapContainer>
      ) : (
        <div style={styles.center}>{tr(lang, 'no_location')}</div>
      )}
    </div>
  );
}

const styles = {
  wrap: { height: '100vh', display: 'flex', flexDirection: 'column' },
  banner: { padding: 12, background: '#6B21A8', color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  map: { flex: 1 },
  center: { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' },
  checkinButton: { padding: 14, border: 'none', backgroundColor: '#2563EB', color: '#fff', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' },
  safeNote: { padding: 10, backgroundColor: '#D1FAE5', color: '#065F46', textAlign: 'center', fontWeight: 'bold' },
  helpNote: { padding: 10, backgroundColor: '#FEE2E2', color: '#991B1B', textAlign: 'center', fontWeight: 'bold' },
};