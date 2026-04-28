import { useState, useEffect } from 'react';
import api from '../api';
import { useLocation } from '../context/LocationContext';
import LeafletMap from '../components/LeafletMap';

const Home = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const { location } = useLocation();

  useEffect(() => {
    api.get('/issues')
      .then(({ data }) => { if (data.success) setIssues(data.issues); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const center = location?.lat
    ? { lat: location.lat, lng: location.lng }
    : issues?.[0]?.location?.coordinates
      ? { lat: issues[0].location.coordinates[1], lng: issues[0].location.coordinates[0] }
      : { lat: 12.9716, lng: 77.5946 };

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 4rem)', overflow: 'hidden' }}>
      {!loading ? (
        <LeafletMap center={center} issues={issues} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#555', fontSize: '11px', letterSpacing: '0.2em' }}>
          ESTABLISHING UPLINK...
        </div>
      )}
    </div>
  );
};

export default Home;