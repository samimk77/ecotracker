import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useLocation } from '../context/LocationContext';
import LeafletMap from '../components/LeafletMap';
import { MapPin, Clock, ShieldCheck, AlertCircle, X, Calendar, Activity, Zap } from 'lucide-react';

const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const rad = (deg) => (deg * Math.PI) / 180;
  const φ1 = rad(lat1); const φ2 = rad(lat2);
  const Δφ = rad(lat2 - lat1); const Δλ = rad(lon2 - lon1);
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const T = {
  bg: '#060810',
  surface: '#0b0f1a',
  card: '#0f1420',
  accent: '#00e5a0',
  border: 'rgba(255,255,255,0.05)',
  text: '#f0f4ff',
  muted: 'rgba(255,255,255,0.4)',
};

import { useLanguage } from '../context/LanguageContext';

const ModeSwitcher = ({ mode, setMode, t }) => {
  const options = [
    { id: 'issues', label: t('nav.issues') },
    { id: 'events', label: t('nav.events') },
    { id: 'sustainability', label: t('nav.sustainability') || 'Sustainability' },
  ];

  return (
    <div style={{
      position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 1000, background: 'rgba(11, 15, 26, 0.85)', backdropFilter: 'blur(12px)',
      padding: '4px', borderRadius: '30px', border: `1px solid ${T.border}`,
      display: 'flex', gap: '4px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
    }}>
      {options.map((opt) => {
        const active = mode === opt.id;
        return (
          <button
            key={opt.id}
            onClick={() => setMode(opt.id)}
            style={{
              padding: '8px 24px', borderRadius: '24px', border: 'none',
              background: active ? T.accent : 'transparent',
              color: active ? '#000' : 'rgba(255,255,255,0.6)',
              fontSize: '0.75rem', fontWeight: active ? 600 : 400, cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

const Home = () => {
  const { t } = useLanguage();
  const [issues, setIssues] = useState([]);
  const [events, setEvents] = useState([]);
  const [mode, setMode] = useState('issues');
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(null);
  const [selectionLabel, setSelectionLabel] = useState("");
  const { location } = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [issRes, evRes] = await Promise.all([
          api.get('/issues'),
          api.get('/events')
        ]);
        if (issRes.data.success) setIssues(issRes.data.issues);
        if (evRes.data.success) setEvents(evRes.data.events);
      } catch (err) {
        console.error('Data sync failed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeData = useMemo(() => {
    if (mode === 'issues') return issues;
    if (mode === 'events') return events;
    return []; // Sustainability placeholder
  }, [mode, issues, events]);

  const center = useMemo(() => {
    if (location?.lat) return { lat: location.lat, lng: location.lng };
    if (activeData?.[0]?.location?.coordinates) {
      return { lat: activeData[0].location.coordinates[1], lng: activeData[0].location.coordinates[0] };
    }
    return { lat: 12.9716, lng: 77.5946 };
  }, [location, activeData]);

  const RADIUS = mode === 'events' ? 500 : 3500;

  const handleAreaClick = (lat, lng, label) => {
    const nearby = activeData.filter(item => {
      if (!item.location?.coordinates) return false;
      const [iLng, iLat] = item.location.coordinates;
      return getDistance(lat, lng, iLat, iLng) <= RADIUS;
    });
    setSelectedItems(nearby);
    setSelectionLabel(label || `Within ${RADIUS >= 1000 ? `${RADIUS / 1000}km` : `${RADIUS}m`}`);
  };

  return (
    <div style={{ 
      width: '100%', height: 'calc(100vh - 4.5rem)', 
      display: 'flex', background: T.bg, overflow: 'hidden' 
    }}>
      <div style={{ flex: 1, position: 'relative' }}>
        <ModeSwitcher mode={mode} setMode={(m) => { setMode(m); setSelectedItems(null); }} t={t} />
        
        {!loading ? (
          <LeafletMap center={center} data={activeData} onAreaClick={handleAreaClick} type={mode} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808', color: T.accent, fontSize: '12px', fontWeight: 800, letterSpacing: '0.2em' }}>
            <Activity size={24} style={{ marginRight: 12, animation: 'pulse 1s infinite' }} />
            SYNCHRONIZING_TACTICAL_DATA...
          </div>
        )}
      </div>

      {selectedItems && (
        <div style={{
          width: '420px', background: T.surface, borderLeft: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          <div style={{ padding: '28px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#fff', fontWeight: 800, letterSpacing: '-0.02em' }}>{selectionLabel}</h3>
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: T.muted }}>{selectedItems.length} {mode} detected in sector</p>
            </div>
            <button 
              onClick={() => setSelectedItems(null)}
              style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#fff', padding: '10px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {selectedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: T.muted }}>
                <AlertCircle size={40} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <p style={{ fontSize: '14px', fontWeight: 500 }}>No active {mode} in this tactical sector.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedItems.map(item => (
                  <div key={item._id} style={{
                    background: T.card, border: `1px solid ${T.border}`,
                    borderRadius: '16px', padding: '20px', transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ 
                        fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', 
                        color: T.accent, letterSpacing: '0.1em', background: 'rgba(0,229,160,0.1)',
                        padding: '4px 10px', borderRadius: '6px'
                      }}>
                        {item.category?.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '11px', color: T.muted, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} /> {new Date(item.createdAt || item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 10px', fontSize: '16px', color: '#fff', fontWeight: 700, lineHeight: 1.4 }}>{item.title}</h4>
                    <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{item.description}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                        <MapPin size={14} color={T.accent} />
                        {item.wardName || "Sector Command"}
                      </div>
                      {mode === 'events' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.accent }}>
                          <Zap size={14} />
                          {item.participantCount || 0} Joined
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Home;