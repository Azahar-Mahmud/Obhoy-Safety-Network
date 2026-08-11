import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = 'https://obhoy-safety-network.onrender.com';

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

  if (error) return <div style={styles.center}>{error}</div>;
  if (!data) return <div style={styles.center}>Loading...</div>;

  // --- STEP 9: Extract mode and scheduledDeadline ---
  const { location, status, updatedAt, kind, destinationLabel, geofence, lastTwoWayResponse, mode, scheduledDeadline } = data;
  // --------------------------------------------------

  // --- STEP 9: Branch the banner text based on mode ---
  const bannerText = kind === 'sos'
    ? (status === 'active' ? `🔴 SOS Active — last updated ${new Date(updatedAt).toLocaleTimeString()}` : '✅ Resolved')
    : mode === 'scheduled'
      ? (status === 'active'
          ? `🟣 Checking in by ${new Date(scheduledDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : status === 'arrived'
            ? '✅ Confirmed safe'
            : '🔴 Missed scheduled check-in — contacts alerted')
      : (status === 'active'
          ? (geofence?.alerted
              ? `🔴 Outside safe zone — last updated ${new Date(updatedAt).toLocaleTimeString()}`
              : geofence
                ? `🟣 Inside safe zone — last updated ${new Date(updatedAt).toLocaleTimeString()}`
                : `🟠 On the way to ${destinationLabel || 'destination'} — last updated ${new Date(updatedAt).toLocaleTimeString()}`)
          : status === 'arrived'
            ? '✅ Arrived safely'
            : '🔴 Missed a check-in — contacts alerted');
  // ----------------------------------------------------

  return (
    <div style={styles.wrap}>
      <div style={styles.banner}>{bannerText}</div>
      
      {kind === 'journey' && status === 'active' && (
        <button 
          onClick={handleRequestCheckin} 
          disabled={requesting || requestSent} 
          style={{...styles.checkinButton, opacity: (requesting || requestSent) ? 0.6 : 1 }}
        >
          {requestSent ? 'Request sent' : "Ask if they're safe"}
        </button>
      )}
      {lastTwoWayResponse === 'safe' && <div style={styles.safeNote}>✅ Confirmed safe</div>}
      {lastTwoWayResponse === 'help' && <div style={styles.helpNote}>🔴 Requested help (Escalated via SMS)</div>}

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
            <Popup>Last known location</Popup>
          </Marker>
        </MapContainer>
      ) : (
        <div style={styles.center}>No location yet.</div>
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