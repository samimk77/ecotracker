import { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useLocation } from '../context/LocationContext';
import LeafletMap from '../components/LeafletMap';

const Home = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const { location } = useLocation();
  const mapContainerRef = useRef(null);

  const getMapCenter = () => {
    // Priority: user location → first issue → default Delhi
    if (location?.lat && location?.lng) {
      return { lat: location.lat, lng: location.lng };
    }
    if (issues?.[0]?.location?.coordinates) {
      return {
        lat: issues[0].location.coordinates[1],
        lng: issues[0].location.coordinates[0]
      };
    }
    return { lat: 12.9716, lng: 77.5946 }; // Bangalore default
  };

  const fetchIssues = async () => {
    try {
      setLoading(true); // Ensure loading is true at start
      const { data } = await api.get('/issues');
      if (data.success) {
        setIssues(data.issues);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const mapCenter = getMapCenter();

  return (
    <div className="p-8 min-h-screen flex flex-col bg-bg">
      <div className="glass-card p-6 flex-1 flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-primary uppercase tracking-[0.4em]">
            Live Planetary Surveillance Map
          </h4>
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-muted">
              <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
              {issues.filter(i => i.urgencyLevel === 'critical').length} CRITICAL_ALERTS
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-muted">
              <div className="w-2 h-2 rounded-full bg-primary" />
              {issues.length} PENDING_ACTIONS
            </div>
          </div>
        </div>

        {/* Map Container */}
        <div
          ref={mapContainerRef}
          className="flex-1 rounded-2xl overflow-hidden border border-primary/20 relative"
          style={{ minHeight: '400px', width: '100%' }}
        >
          {!loading ? (
            <div className="absolute inset-0">
              <LeafletMap
                center={mapCenter}
                issues={issues}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/5 text-muted text-[10px] font-black uppercase tracking-[0.3em]">
              Establishing Uplink...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;