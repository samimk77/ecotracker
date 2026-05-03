import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api';
import { useLocation as useLocationCtx } from '../context/LocationContext';
import LeafletMap from '../components/LeafletMap';
import MapboxMap from '../components/MapboxMap';
import { MapPin, Clock, AlertCircle, X, Activity, Zap, Camera } from 'lucide-react';
import SmartSortModal from '../components/SmartSortModal';
import mapboxgl from 'mapbox-gl';
import { useLanguage } from '../context/LanguageContext';

/* ─── helpers ─────────────────────────────────────────────────── */
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3, rad = d => d * Math.PI / 180;
  const φ1 = rad(lat1), φ2 = rad(lat2);
  const Δφ = rad(lat2 - lat1), Δλ = rad(lon2 - lon1);
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/* ─── MAP MODE SWITCHER (top-center over map) ────────────────── */
const MapModeSwitcher = ({ mode, onSwitch }) => {
  const OPTIONS = [
    { id: 'issues',         label: 'Issues',         color: '#ef4444' },
    { id: 'events',         label: 'Events',         color: '#3b82f6' },
    { id: 'sustainability', label: 'EcoImpact', color: '#00e5a0' },
  ];
  const activeIdx = OPTIONS.findIndex(o => o.id === mode);
  const btnRefs = useRef([]);
  const [pill, setPill] = useState({ left: 0, width: 0 });
  const activeColor = OPTIONS[activeIdx]?.color || '#00e5a0';

  useEffect(() => {
    const el = btnRefs.current[activeIdx];
    if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeIdx]);

  return (
    <div style={{
      position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100, padding: 4, borderRadius: 30,
      background: 'var(--color-surface)', backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid var(--color-border)',
      display: 'flex', gap: 0,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
    }}>
      {/* Sliding pill */}
      <div style={{
        position: 'absolute', top: 4, height: 'calc(100% - 8px)',
        left: pill.left, width: pill.width,
        background: activeColor,
        borderRadius: 22,
        transition: 'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease',
        pointerEvents: 'none', zIndex: 0,
        boxShadow: `0 4px 20px ${activeColor}55`,
      }} />
      {OPTIONS.map((opt, i) => {
        const isActive = mode === opt.id;
        return (
          <button
            key={opt.id}
            ref={el => btnRefs.current[i] = el}
            onClick={() => onSwitch(opt.id)}
            style={{
              position: 'relative', zIndex: 1,
              padding: '8px 22px', borderRadius: 22, border: 'none',
              background: 'transparent',
              color: isActive ? '#000' : 'var(--color-text-muted)',
              fontSize: 11, fontWeight: isActive ? 800 : 500,
              cursor: 'pointer',
              transition: 'color 0.25s ease',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

/* ─── HOME PAGE ─────────────────────────────────────────────────── */
const Home = () => {
  const { t } = useLanguage();
  const [issues, setIssues] = useState([]);
  const [events, setEvents] = useState([]);
  const [mode, setMode] = useState('issues');
  const [contentVisible, setContentVisible] = useState(true);
  const [sidebarKey, setSidebarKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState(null);
  const [selectionLabel, setSelectionLabel] = useState('');
  const { location } = useLocationCtx();
  const [isSmartSortOpen, setIsSmartSortOpen] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    try { setWebGLSupported(mapboxgl.supported()); } catch { setWebGLSupported(false); }
    const fetchData = async () => {
      try {
        setLoading(true);
        const [issRes, evRes] = await Promise.all([api.get('/issues'), api.get('/events')]);
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

  useEffect(() => {
    const handleOpenSmartSort = () => setIsSmartSortOpen(true);
    window.addEventListener('open:smart-sort', handleOpenSmartSort);
    return () => window.removeEventListener('open:smart-sort', handleOpenSmartSort);
  }, []);

  const handleModeSwitch = (newMode) => {
    if (newMode === mode) return;
    setContentVisible(false);
    setTimeout(() => {
      setMode(newMode);
      setSelectedItems(null);
      setSidebarKey(k => k + 1);
      setContentVisible(true);
    }, 180);
  };

  const activeData = useMemo(() => {
    if (mode === 'issues') return issues;
    if (mode === 'events') return events;
    return [];
  }, [mode, issues, events]);

  // Map receives dynamic data based on active mode
  const mapData = useMemo(() => activeData, [activeData]);

  const center = useMemo(() => {
    if (location?.lat) return { lat: location.lat, lng: location.lng };
    if (activeData?.[0]?.location?.coordinates)
      return { lat: activeData[0].location.coordinates[1], lng: activeData[0].location.coordinates[0] };
    return { lat: 12.9716, lng: 77.5946 };
  }, [location, activeData]);

  const RADIUS = mode === 'events' ? 500 : 3500;

  const handleAreaClick = (lat, lng, label, specificItem = null, zoneId = null) => {
    if (specificItem) {
      setSelectedItems([specificItem]);
      setSelectionLabel(specificItem.title);
      return;
    }

    const nearby = activeData.filter(item => {
      if (zoneId && item.ward === zoneId) return true;
      if (!item.location?.coordinates) return false;
      const [iLng, iLat] = item.location.coordinates;
      return getDistance(lat, lng, iLat, iLng) <= RADIUS;
    });
    setSelectedItems(nearby);
    setSelectionLabel(label || `Within ${RADIUS >= 1000 ? `${RADIUS/1000}km` : `${RADIUS}m`}`);
  };

  const modeColor = { issues: '#ef4444', events: '#3b82f6', sustainability: '#00e5a0' };
  const activeColor = modeColor[mode] || 'var(--color-primary)';

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden', background: 'var(--color-bg)', position: 'relative' }}>

      {/* ── MAP AREA ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* ── Sliding pill mode switcher — top center ── */}
        <MapModeSwitcher mode={mode} onSwitch={handleModeSwitch} />

        {!loading ? (
          webGLSupported
            ? <MapboxMap center={center} data={mapData} onAreaClick={handleAreaClick} type={mode} />
            : <LeafletMap center={center} data={mapData} onAreaClick={handleAreaClick} type={mode} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg)', color: 'var(--color-primary)', fontSize: 12, fontWeight: 800, letterSpacing: '0.2em', flexDirection: 'column', gap: 16 }}>
            <Activity size={28} style={{ animation: 'pulse 1s infinite' }} />
            SYNCHRONIZING TACTICAL DATA...
          </div>
        )}
      </div>

      {/* ── RIGHT DETAIL PANEL ── */}
      {selectedItems && (
        <div
          key={sidebarKey}
          style={{
            width: 400, background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)',
            display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--color-text)', fontWeight: 800, letterSpacing: '-0.02em' }}>{selectionLabel}</h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>{selectedItems.length} {mode} in sector</p>
            </div>
            <button
              onClick={() => setSelectedItems(null)}
              style={{ background: 'var(--color-border)', border: 'none', color: 'var(--color-text)', padding: 8, borderRadius: 10, cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', padding: 20,
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.22s ease, transform 0.22s ease',
          }}>
            {selectedItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-dim)' }}>
                <AlertCircle size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                <p style={{ fontSize: 13 }}>No {mode} in this sector.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {selectedItems.map(item => (
                  <div key={item._id} style={{
                    background: 'var(--color-surface-elevated)', border: '1px solid var(--color-border)',
                    borderRadius: 14, padding: 18, transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-main)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
                        color: activeColor, letterSpacing: '0.1em',
                        background: `${activeColor}18`, padding: '3px 9px', borderRadius: 6,
                      }}>
                        {item.category?.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} /> {new Date(item.createdAt || item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 style={{ margin: '0 0 8px', fontSize: 15, color: 'var(--color-text)', fontWeight: 700, lineHeight: 1.4 }}>{item.title}</h4>
                    <p style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{item.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-muted)' }}>
                        <MapPin size={13} color={activeColor} /> {item.wardName || 'Sector'}
                      </div>
                      {mode === 'events' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: activeColor }}>
                          <Zap size={13} /> {item.participantCount || 0} Joined
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

      <SmartSortModal
        isOpen={isSmartSortOpen}
        onClose={() => setIsSmartSortOpen(false)}
        onClassificationSuccess={(data) => console.log('Points:', data.ecoPoints)}
      />

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);   opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Home;