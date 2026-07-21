import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const API_BASE_URL = 'https://obhoy-safety-network.onrender.com'; // ← Your actual Render backend URL

function getTokenFromUrl() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[parts.length - 1];
}

export default function App() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getTokenFromUrl();
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
  }, []);

  if (error) return <div style={styles.center}>{error}</div>;
  if (!data) return <div style={styles.center}>Loading...</div>;

  const { location, status, updatedAt } = data;

  return (
    <div style={styles.wrap}>
      <div style={styles.banner}>
        {status === 'active' ? `🔴 Active — last updated ${new Date(updatedAt).toLocaleTimeString()}` : '✅ Resolved'}
      </div>
      {location ? (
        <MapContainer center={[location.lat, location.lng]} zoom={16} style={styles.map}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
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
};