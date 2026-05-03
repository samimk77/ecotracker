import React, { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, NavigationControl, Marker, Popup } from 'react-map-gl/mapbox';
import { buildMergedWards } from './wardAggregation';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Activity, Info, Trash2, Database, Truck, Navigation, X, AlertTriangle, CheckCircle, Clock, BarChart2, Sparkles } from 'lucide-react';
import api from '../api';
import { io } from 'socket.io-client';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function getColor(score) {
  if (score >= 75) return "#a7f3d0"; // Lighter Emerald for transparency
  if (score >= 45) return "#f59e0b"; // Orange (Amber)
  return "#ef4444"; // Red (Rose)
}

export default function MapboxMap({ center, data: items = [], onAreaClick, type = 'issues' }) {
  const [wards, setWards] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showBins, setShowBins] = useState(false);
  const [bins, setBins] = useState([]);
  const [fleetRoute, setFleetRoute] = useState(null);
  const [truckPos, setTruckPos] = useState(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false); // toast for collection done
  const [selectedBin, setSelectedBin] = useState(null);
  const navigate = useNavigate();
  const mapRef = useRef();

  const [activeDisposalBin, setActiveDisposalBin] = useState(null);
  const [showDisposalToast, setShowDisposalToast] = useState(false);
  const [hoveredWardId, setHoveredWardId] = useState(null);

  useEffect(() => {
    fetch("/data/wards.geojson")
      .then((res) => res.json())
      .then((data) => setWards(data))
      .catch((err) => console.error("GeoJSON Load Error:", err));

    api.get('/iot/bins')
      .then(res => {
        if (res.data.success) setBins(res.data.bins);
      })
      .catch(err => console.error("Bin Fetch Error:", err));

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', { withCredentials: true });
    socket.on('bins:update', (updatedBins) => {
      setBins(updatedBins);
    });
    // When a bin hits 90%, only push to Navbar notification
    socket.on('bin:full', ({ binId, fillLevel }) => {
      window.dispatchEvent(new CustomEvent('bin:full:alert', { 
        detail: { binId, fillLevel: Math.round(fillLevel) } 
      }));
    });
    // Listen for bin:guide (from Smart Sort)
    const handleBinGuide = (e) => {
      const { lat, lng, binId } = e.detail;
      setActiveDisposalBin(binId);
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [lng, lat],
          zoom: 19,
          pitch: 75,
          bearing: Math.random() * 90 - 45,
          essential: true,
          duration: 2500
        });
      }
      
      // Step 1: Open Lid (after fly-to starts)
      setTimeout(() => {
        setIsLidOpen(true);
      }, 1500);

      // Step 2: Show success toast and Close Lid
      setTimeout(() => {
        setShowDisposalToast(true);
        setIsLidOpen(false); // Close lid
        setTimeout(() => {
          setShowDisposalToast(false);
          setActiveDisposalBin(null);
        }, 3000);
      }, 3500);
    };
    window.addEventListener('bin:guide', handleBinGuide);

    return () => {
      socket.disconnect();
      window.removeEventListener('bin:guide', handleBinGuide);
    };
  }, []);

  const [isLidOpen, setIsLidOpen] = useState(false);

  // Custom Animated Glassmorphism Bin Icon (Compact & Whitish)
  const SmartBinIcon = ({ color, fillLevel, isTargeted, lidOpen }) => (
    <div style={{ position: 'relative', width: isTargeted ? 34 : 22, height: isTargeted ? 40 : 26 }}>
      {/* Lid - Glassmorphism Whitish */}
      <div style={{
        position: 'absolute', top: 0, left: '2%', right: '2%', height: '12%',
        background: isTargeted ? '#00e5a0' : 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: `1px solid ${isTargeted ? '#00e5a0' : 'rgba(255,255,255,0.4)'}`,
        borderRadius: '3px 3px 1px 1px',
        transformOrigin: 'left bottom',
        transform: lidOpen ? 'rotate(-115deg)' : 'rotate(0deg)',
        transition: 'transform 0.7s cubic-bezier(0.19, 1, 0.22, 1)',
        zIndex: 10,
      }} />
      
      {/* Rim of Bin - Brighter */}
      <div style={{
        position: 'absolute', top: '12%', left: 0, right: 0, height: '8%',
        background: isTargeted ? '#00e5a0' : 'rgba(255,255,255,0.35)',
        borderRadius: '1px',
        zIndex: 5
      }} />

      {/* Body - Tapered Bin Shape */}
      <div style={{
        position: 'absolute', bottom: 0, left: '8%', right: '8%', height: '82%',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: `1px solid ${isTargeted ? 'rgba(0,229,160,0.8)' : 'rgba(255,255,255,0.25)'}`,
        borderRadius: '0 0 5px 5px',
        clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column-reverse'
      }}>
        {/* Liquid Fill */}
        <div style={{
          height: `${fillLevel}%`,
          width: '100%',
          background: `linear-gradient(to top, ${color}cc, ${color}88)`,
          transition: 'height 1.5s ease-in-out',
          borderTop: `1px solid ${color}aa`
        }} />
        
        {/* Central Icon - Pure White */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0.9
        }}>
           <Trash2 size={isTargeted ? 14 : 10} color="#fff" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );



  const deployFleet = async () => {
    if (isDeploying) return;
    try {
      const res = await api.get('/fleet/route');
      if (res.data.success && res.data.route.length > 0) {
        // Play Truck Horn & Engine Start
        try {
          const horn = new Audio('https://assets.mixkit.co/active_storage/sfx/1006/1006-preview.mp3');
          horn.volume = 0.6;
          horn.play();

          const engine = new Audio('https://assets.mixkit.co/active_storage/sfx/2560/2560-preview.mp3');
          engine.volume = 1.0;
          engine.play();
          // Stop engine sound after 2 seconds
          setTimeout(() => {
            engine.pause();
            engine.currentTime = 0;
          }, 2000);
        } catch (e) { console.warn(e); }

        // Fetch road-snapped geometry from Mapbox
        const waypoints = [[77.5946, 12.9716], ...res.data.route.map(r => r.coords)];
        const routeStr = waypoints.map(w => w.join(',')).join(';');
        
        try {
          const dirRes = await fetch(`https://api.mapbox.com/directions/v5/mapbox/driving/${routeStr}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`);
          const dirData = await dirRes.json();
          
          if (dirData.routes && dirData.routes[0]) {
            const fullCoords = dirData.routes[0].geometry.coordinates;
            setFleetRoute(fullCoords);
            animateTruck(fullCoords, res.data.route);
          } else {
            setFleetRoute(res.data.route.map(r => r.coords));
            animateTruck(res.data.route.map(r => r.coords), res.data.route);
          }
        } catch (e) {
          setFleetRoute(res.data.route.map(r => r.coords));
          animateTruck(res.data.route.map(r => r.coords), res.data.route);
        }
      } else {
        alert("All sectors clear. No collection required.");
      }
    } catch (err) {
      console.error('Fleet Deployment Error:', err);
    }
  };

  const animateTruck = (coords, originalRoute) => {
    setIsDeploying(true);
    let step = 0;
    
    const frame = () => {
      if (step >= coords.length) {
        setTimeout(async () => {
          setIsDeploying(false);
          setFleetRoute(null);
          setTruckPos(null);
          
          const cleanedBinIds = originalRoute.filter(p => p.type === 'bin').map(p => p.id);
          setBins(prev => prev.map(b => 
            cleanedBinIds.includes(b.binId) ? { ...b, fillLevel: 0, status: 'normal' } : b
          ));

          try {
            await api.post('/iot/reset', { binIds: cleanedBinIds });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          } catch (err) { console.error('Reset Bins Error:', err); }
        }, 500);
        return;
      }

      const [lng, lat] = coords[step];
      setTruckPos({ lng, lat });
      
      // Speed multiplier (skip steps for faster animation on long routes)
      step += Math.max(1, Math.floor(coords.length / 100)); 
      requestAnimationFrame(frame);
    };
    
    requestAnimationFrame(frame);
  };

  const aggregatedData = useMemo(() => {
    if (!wards) return { zones: null, markers: [] };
    const base = buildMergedWards(wards, 22);
    
    const markersWithCounts = base.markers.map(m => ({ 
      ...m, count: 0, latSum: 0, lngSum: 0
    }));
    
    items.forEach(item => {
      if (!item.location?.coordinates) return;
      const [lng, lat] = item.location.coordinates;
      let closestIdx = 0;
      let minD = Infinity;
      markersWithCounts.forEach((m, idx) => {
        const d = Math.pow(m.center[0] - lat, 2) + Math.pow(m.center[1] - lng, 2);
        if (d < minD) { minD = d; closestIdx = idx; }
      });
      markersWithCounts[closestIdx].count += 1;
      markersWithCounts[closestIdx].latSum += lat;
      markersWithCounts[closestIdx].lngSum += lng;
    });

    const finalMarkers = markersWithCounts.map(m => {
      let dynamicScore;
      if (type === 'issues') {
        dynamicScore = Math.max(10, 100 - (m.count * 30)); // 0->100, 1->70, 2->40, 3->10
      } else if (type === 'sustainability') {
        // Deterministic mock score based on zoneId to make it look varied but stable
        const hash = String(m.zoneId || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        if (hash % 17 === 0) {
          dynamicScore = 15 + (hash % 25); // Rare Red
        } else if (hash % 5 === 0) {
          dynamicScore = 48 + (hash % 20); // Occasional Orange
        } else {
          dynamicScore = 78 + (hash % 23); // Common Green
        }
      } else {
        dynamicScore = 100;
      }

      return {
        ...m,
        wardCount: m.count,
        score: dynamicScore
      };
    });

    const updatedZones = {
      ...base.zones,
      features: base.zones.features.map(feature => {
        const zoneId = feature.properties.zone_id;
        const marker = finalMarkers.find(m => m.zoneId === zoneId);
        return {
          ...feature,
          properties: {
            ...feature.properties,
            ward_count: marker ? marker.wardCount : 0,
            score: marker ? marker.score : 100
          }
        };
      })
    };

    return { zones: updatedZones, markers: finalMarkers };
  }, [wards, items, type]);

  const mapCenter = center ? { longitude: center.lng, latitude: center.lat } : { longitude: 77.5946, latitude: 12.9716 };

  const extrusionLayer = {
    id: 'ward-extrusion',
    type: 'fill-extrusion',
    paint: {
      'fill-extrusion-color': [
        'interpolate', ['linear'], ['get', 'score'],
        0, '#ef4444',
        50, '#f59e0b',
        100, '#00e5a0'
      ],
      'fill-extrusion-height': [
        'interpolate', ['linear'], ['zoom'],
        10, ['max', 50, ['get', 'height']],
        14, ['+', ['max', 50, ['get', 'height']], ['case', ['==', ['get', 'zone_id'], hoveredWardId], 400, 0]]
      ],
      'fill-extrusion-base': 2,
      'fill-extrusion-opacity': 0.6,
      'fill-extrusion-height-transition': { duration: 500 }
    }
  };

  const lineLayer = {
    id: 'ward-lines',
    type: 'line',
    paint: {
      'line-color': 'rgba(255, 255, 255, 0.5)',
      'line-width': 1.5,
      'line-opacity': 0.8
    }
  };



  const routeLayer = {
    id: 'fleet-route',
    type: 'line',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': '#3b82f6',
      'line-width': 4,
      'line-dasharray': [2, 2],
    }
  };

  const mapboxZones = useMemo(() => {
    if (!aggregatedData.zones) return null;
    return {
      ...aggregatedData.zones,
      features: aggregatedData.zones.features.map(f => {
        const score = Number(f.properties.score || 100);
        const count = Number(f.properties.ward_count || 0);
        // Ensure all zones have height, but boost problem areas
        const height = type === 'issues' 
          ? (count * 300 + 100) 
          : (score * 12);
        return {
          ...f,
          properties: {
            ...f.properties,
            color: getColor(score),
            score: score,
            height: height
          }
        };
      })
    };
  }, [aggregatedData.zones, type]);
  
  // ── Theme Configuration (Synced with Global Theme) ──
  const { theme } = useTheme();
  const isDay = theme === 'light';
  const mapStyle = isDay ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11';
  const fogColor = isDay ? '#f8fafc' : '#242b3b';

  const buildingLayer = {
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 15,
    paint: {
      'fill-extrusion-color': isDay ? '#eee' : '#1e293b',
      'fill-extrusion-height': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15,
        0,
        15.05,
        ['get', 'height']
      ],
      'fill-extrusion-base': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15,
        0,
        15.05,
        ['get', 'min_height']
      ],
      'fill-extrusion-opacity': 0.6
    }
  };

  const skyLayer = {
    id: 'sky',
    type: 'sky',
    paint: {
      'sky-type': 'atmosphere',
      'sky-atmosphere-sun': [0.0, 0.0],
      'sky-atmosphere-sun-intensity': 15
    }
  };

  const labelLayerOverride = {
    id: 'place-label-white',
    type: 'symbol',
    source: 'composite',
    'source-layer': 'place_label',
    paint: {
      'text-color': '#ffffff',
      'text-halo-color': 'rgba(0,0,0,0.5)',
      'text-halo-width': 1
    }
  };

  const onMapClick = (e) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      if (onAreaClick) {
        onAreaClick(e.lngLat.lat, e.lngLat.lng, feature.properties.zone_name || "Sector", null, feature.properties.zone_id);
      }
    }
  };

  const onMapHover = (e) => {
    if (e.features && e.features.length > 0) {
      setHoveredWardId(e.features[0].properties.zone_id);
    } else {
      setHoveredWardId(null);
    }
  };

  const activeMode = showBins ? 'bins' : isDeploying ? 'fleet' : 'live';

  const modeConfig = {
    live:     { label: 'Live Feed',    icon: Activity,  color: '#00e5a0', bg: 'rgba(255,255,255,0.03)',  border: 'rgba(255,255,255,0.08)',  desc: 'Real-time environmental issues reported by citizens across the city.' },

    bins:     { label: 'Smart Bins',   icon: Database,  color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)',  desc: 'Live IoT sensors tracking fill levels across 30 city containers.' },
    fleet:    { label: 'Fleet Active', icon: Truck,     color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)',  desc: 'Optimizing collection routes and dispatching units to full bins.' },
  };

  // ── Computed bin stats ──
  const binStats = useMemo(() => {
    const full = bins.filter(b => b.fillLevel >= 90).length;
    const warning = bins.filter(b => b.fillLevel >= 70 && b.fillLevel < 90).length;
    const ok = bins.filter(b => b.fillLevel < 70).length;
    const avg = bins.length ? Math.round(bins.reduce((s, b) => s + b.fillLevel, 0) / bins.length) : 0;
    return { full, warning, ok, total: bins.length, avg };
  }, [bins]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>

      {/* ── SMART BINS STATS PANEL (right side) ── */}
      {showBins && bins.length > 0 && (
        <div style={{
          position: 'absolute', top: 40, right: 16, zIndex: 50, width: 220,
          background: 'var(--color-surface-elevated)', backdropFilter: 'blur(16px)',
          border: '1px solid var(--color-border)', borderRadius: 16,
          padding: '14px 16px', boxShadow: 'var(--shadow-main)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={14} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>IoT Dashboard</div>
              <div style={{ fontSize: 9, color: 'var(--color-text-dim)', fontWeight: 500 }}>{binStats.total} sensors active</div>
            </div>
          </div>

          {/* City capacity bar */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--color-text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>City Capacity Used</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: binStats.avg > 70 ? 'var(--color-danger)' : binStats.avg > 50 ? '#eab308' : 'var(--color-primary)' }}>{binStats.avg}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'var(--color-border)', overflow: 'hidden' }}>
              <div style={{ width: `${binStats.avg}%`, height: '100%', borderRadius: 99, background: binStats.avg > 70 ? 'linear-gradient(90deg,#ef4444,#b91c1c)' : binStats.avg > 50 ? 'linear-gradient(90deg,#eab308,#ca8a04)' : 'linear-gradient(90deg,#22c55e,#16a34a)', transition: 'width 1s ease' }} />
            </div>
          </div>

          {/* Status breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Full (≥90%)', count: binStats.full, color: 'var(--color-danger)', bg: 'var(--color-danger-glow)', Icon: AlertTriangle },
              { label: 'Warning (≥70%)', count: binStats.warning, color: '#eab308', bg: 'rgba(234,179,8,0.1)', Icon: Clock },
              { label: 'OK (<70%)', count: binStats.ok, color: 'var(--color-primary)', bg: 'var(--color-primary-glow)', Icon: CheckCircle },
            ].map(({ label, count, color, bg, Icon: IC }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: bg, borderRadius: 10, border: `1px solid ${color}22` }}>
                <IC size={12} color={color} />
                <span style={{ flex: 1, fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color }}>{count}</span>
                {/* Mini bar */}
                <div style={{ width: 28, height: 4, borderRadius: 99, background: 'var(--color-border)', overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ width: `${binStats.total ? (count / binStats.total) * 100 : 0}%`, height: '100%', background: color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Divider + last update */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--color-border)', fontSize: 9, color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 4px #22c55e' }} />
            Live • Updates every 10s
          </div>
        </div>
      )}

      {/* ── COLLECTION SUCCESS TOAST ── */}
      {showSuccess && (
        <div style={{
          position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 300,
          background: 'rgba(16,185,129,0.9)', backdropFilter: 'blur(8px)',
          padding: '12px 24px', borderRadius: 50, color: '#030b08',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 10px 40px rgba(16,185,129,0.5)',
          animation: 'zoomIn 0.3s ease',
        }}>
          <CheckCircle size={20} />
          <span style={{ fontWeight: 800, fontSize: 14 }}>City Cleanup Complete! All full bins emptied.</span>
        </div>
      )}

      {/* ── VERTICAL SIDEBAR CONTROL PANEL ── */}
      <div style={{
        position: 'absolute', top: 40, left: 16, zIndex: 50,
        display: 'flex', flexDirection: 'column', gap: 6, width: 160,
      }}>
        {/* Mode Buttons */}
        {[['live', Activity, '#00e5a0'], ['bins', Database, '#3b82f6']].map(([mode, Icon, color]) => {
          const isActive = activeMode === mode && !isDeploying;
          return (
            <button
              key={mode}
              onClick={() => {
                if (mode === 'live')     { setShowBins(false); }
                if (mode === 'bins')    { setShowBins(true); }
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px',
                borderRadius: 12,
                border: `1px solid ${isActive ? color : 'var(--color-border)'}`,
                background: isActive ? (mode === 'live' ? 'rgba(255,255,255,0.06)' : `rgba(${color === '#00e5a0' ? '0,229,160' : color === '#a855f7' ? '168,85,247' : '59,130,246'},0.12)`) : 'rgba(255,255,255,0.02)',
                backdropFilter: 'blur(20px)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 4px 16px ${color}1a` : 'none',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: isActive ? color : 'var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}>
                <Icon size={13} color={isActive ? (isDay ? '#fff' : '#000') : color} strokeWidth={2.5} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: isActive ? '#fff' : 'var(--color-text)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {modeConfig[mode].label}
                </div>
              </div>
            </button>
          );
        })}

        {/* Deploy Fleet — Action Button */}
        <button
          onClick={deployFleet}
          disabled={isDeploying}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px',
            borderRadius: 12,
            border: `1px solid ${isDeploying ? '#f97316' : 'var(--color-border)'}`,
            background: isDeploying ? 'rgba(249,115,22,0.25)' : 'var(--color-surface)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            cursor: isDeploying ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isDeploying ? '0 0 20px rgba(249,115,22,0.3)' : 'none',
          }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: 8,
            background: isDeploying ? '#f97316' : 'rgba(249,115,22,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Truck size={13} color={isDeploying ? '#fff' : '#f97316'} strokeWidth={2.5} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: isDeploying ? '#fdba74' : '#f97316', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {isDeploying ? 'Fleet Active' : 'Deploy Fleet'}
            </div>
          </div>
        </button>
      </div>

      {/* ── DISPOSAL SUCCESS TOAST ── */}
      {showDisposalToast && (
        <div style={{
          position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 10000,
          background: 'rgba(0, 229, 160, 0.98)', backdropFilter: 'blur(12px)',
          padding: '8px 18px', borderRadius: 50, color: '#030b08',
          display: 'flex', alignItems: 'center', gap: 10,
          boxShadow: '0 12px 32px rgba(0, 229, 160, 0.3)',
          animation: 'slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <Sparkles size={16} fill="#030b08" />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 900, fontSize: 12, letterSpacing: '-0.01em' }}>DISPOSAL SUCCESS!</div>
            <div style={{ fontWeight: 700, fontSize: 9, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>+15 EcoPoints</div>
          </div>
        </div>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: 78.9629,
          latitude: 20.5937,
          zoom: 3.5,
          pitch: 0,
          bearing: 0
        }}
        onLoad={(e) => {
          if (mapRef.current) {
            mapRef.current.flyTo({
              center: [77.5946, 12.9716],
              zoom: 11,
              pitch: 55,
              bearing: -20,
              duration: 4000,
              essential: true
            });
          }
        }}
        mapStyle={mapStyle}
        fog={{
          range: [0.5, 10],
          color: fogColor,
          'horizon-blend': 0.03,
          'high-color': isDay ? '#def' : '#10141d',
          'space-color': isDay ? '#87ceeb' : '#000000',
          'star-intensity': isDay ? 0 : 0.2
        }}
        terrain={{ source: 'mapbox-dem', exaggeration: 1.1 }}
        interactiveLayerIds={['ward-extrusion']}
        onClick={onMapClick}
        onMouseMove={onMapHover}
        onMouseLeave={() => setHoveredWardId(null)}
      >
        <NavigationControl position="top-right" />
        <Source
          id="mapbox-dem"
          type="raster-dem"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxzoom={14}
        />
        <Layer {...skyLayer} />
        <Layer {...buildingLayer} />
        <Layer {...labelLayerOverride} />
        
        {mapboxZones && (
          <Source id="wards-source" type="geojson" data={mapboxZones}>
            <Layer {...{
              ...extrusionLayer, 
              paint: { 
                ...extrusionLayer.paint, 
                'fill-extrusion-opacity': (showBins || isDeploying) ? 0 : (
                  type === 'events' ? 0.15 : 0.35
                )
              } 
            }} />
            <Layer {...lineLayer} />
          </Source>
        )}

        {fleetRoute && (
          <Source id="route" type="geojson" data={{
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: fleetRoute
            }
          }}>
            <Layer {...routeLayer} />
          </Source>
        )}

        {truckPos && (
          <Marker longitude={truckPos.lng} latitude={truckPos.lat} anchor="center">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56 }}>
              {/* Outer radar ring 1 */}
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: '2px solid rgba(249,115,22,0.5)',
                animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
              }} />
              {/* Outer radar ring 2 — delayed */}
              <div style={{
                position: 'absolute', inset: 6,
                borderRadius: '50%',
                border: '1.5px solid rgba(249,115,22,0.35)',
                animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite 0.4s',
              }} />
              {/* Soft glow disc */}
              <div style={{
                position: 'absolute', inset: 10,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(249,115,22,0.35) 0%, transparent 70%)',
              }} />
              {/* Icon container */}
              <div style={{
                position: 'relative', zIndex: 10,
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                border: '2px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 24px rgba(249,115,22,0.7), 0 4px 12px rgba(0,0,0,0.5)',
              }}>
                <Truck size={18} color="white" strokeWidth={2} />
              </div>
              {/* Label */}
              <div style={{
                position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
                fontSize: 8, fontWeight: 800, color: '#fb923c',
                letterSpacing: '0.06em', whiteSpace: 'nowrap',
                textShadow: '0 1px 6px rgba(0,0,0,1)',
              }}>ECO-FLEET</div>
            </div>
          </Marker>
        )}
        {showBins && bins.map(bin => {
          const fill = Math.round(bin.fillLevel);
          const isFull    = fill >= 90;
          const isWarning = fill >= 70 && fill < 90;
          const color = isFull ? '#ef4444' : isWarning ? '#eab308' : '#22c55e';
          const isTargeted = activeDisposalBin === bin.binId;
          
          return (
            <Marker
              key={bin._id}
              longitude={bin.location.coordinates[0]}
              latitude={bin.location.coordinates[1]}
              anchor="bottom"
              onClick={e => { e.originalEvent.stopPropagation(); setSelectedBin(bin); }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, cursor: 'pointer', position: 'relative' }}>
                {isTargeted && (
                  <div style={{
                    position: 'absolute', top: -30, width: 50, height: 50,
                    borderRadius: '50%', background: 'radial-gradient(circle, #00e5a0 0%, transparent 70%)',
                    animation: 'ping 1s infinite', zIndex: -1
                  }} />
                )}
                
                <SmartBinIcon 
                  color={isTargeted ? '#00e5a0' : color} 
                  fillLevel={fill} 
                  isTargeted={isTargeted} 
                  lidOpen={isTargeted && isLidOpen}
                />

                {(fill >= 70 || isTargeted) && (
                  <span style={{ 
                    fontSize: isTargeted ? 13 : 10, 
                    fontWeight: 900, 
                    color: isTargeted ? '#00e5a0' : color, 
                    lineHeight: 1, 
                    letterSpacing: '0.03em', 
                    textShadow: '0 1px 12px rgba(0,0,0,1)',
                    marginTop: isTargeted ? 4 : 0
                  }}>
                    {fill}%
                  </span>
                )}
              </div>
            </Marker>
          );
        })}

        {/* Bin click popup */}
        {selectedBin && selectedBin.location && (
          <Popup
            longitude={selectedBin.location.coordinates[0]}
            latitude={selectedBin.location.coordinates[1]}
            anchor="bottom"
            offset={36}
            onClose={() => setSelectedBin(null)}
            closeButton={false}
          >
            <div style={{ padding: 0, fontFamily: 'var(--font-body)', width: 220, background: 'var(--color-surface-elevated)', borderRadius: 14, border: '1px solid var(--color-border)', overflow: 'hidden', boxShadow: 'var(--shadow-main)' }}>
              {/* Header */}
              {(() => {
                const fill = Math.round(selectedBin.fillLevel);
                const isFull = fill >= 90;
                const isWarn = fill >= 70;
                const color = isFull ? '#ef4444' : isWarn ? '#eab308' : '#22c55e';
                const statusLabel = isFull ? 'FULL' : isWarn ? 'WARNING' : 'OK';
                return (
                  <>
                    <div style={{ background: `${color}18`, padding: '10px 12px', borderBottom: `1px solid var(--color-border)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Trash2 size={13} color={color} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text)' }}>{selectedBin.binId}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 800, color, background: `${color}15`, padding: '2px 8px', borderRadius: 20, border: `1px solid ${color}33` }}>{statusLabel}</span>
                        <button onClick={() => setSelectedBin(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-dim)', padding: 0, display: 'flex' }}><X size={14} /></button>
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Fill bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 9, color: 'var(--color-text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fill Level</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color }}>{fill}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                          <div style={{ width: `${fill}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.8s ease' }} />
                        </div>
                      </div>
                      {/* Location */}
                      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '7px 9px' }}>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>📍 Location</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                          {selectedBin.location.coordinates[1].toFixed(5)}°N<br />
                          {selectedBin.location.coordinates[0].toFixed(5)}°E
                        </div>
                      </div>
                      
                      {/* Trend History Mock */}
                      <div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>📊 Fill Level Trend (24h)</div>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24, padding: '0 4px' }}>
                          {[40, 55, 30, 65, 80, fill].map((val, i) => (
                            <div key={i} style={{ 
                              flex: 1, 
                              height: `${val}%`, 
                              background: i === 5 ? color : 'rgba(255,255,255,0.15)', 
                              borderRadius: '2px 2px 0 0',
                              transition: 'height 1s ease'
                            }} />
                          ))}
                        </div>
                      </div>

                      {/* Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                        <span>Last Emptied: <span style={{ color: '#6ee7b7' }}>{selectedBin.lastEmptied ? new Date(selectedBin.lastEmptied).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '2h ago'}</span></span>
                        <span>IoT • Live</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </Popup>
        )}

        {!showBins && !isDeploying && items.map(item => {
           if (!item.location?.coordinates) return null;
           const [lng, lat] = item.location.coordinates;
           const isSelected = selectedItem?._id === item._id;
           
           return (
             <Marker 
               key={item._id} 
               longitude={lng} 
               latitude={lat}
               anchor="bottom"
               onClick={e => {
                 e.originalEvent.stopPropagation();
                 setSelectedItem(item);
                 if (onAreaClick) onAreaClick(lat, lng, item.title, item);
               }}
             >
               <div style={{
                 color: isSelected ? '#00e5a0' : (type === 'events' ? '#60a5fa' : '#f87171'),
                 filter: isSelected 
                    ? `drop-shadow(0 0 12px #00e5a0)` 
                    : (type === 'events' ? 'drop-shadow(0 0 8px rgba(96,165,250,0.8))' : 'drop-shadow(0 0 8px rgba(248,113,113,0.8))'),
                 cursor: 'pointer',
                 transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                 transform: isSelected ? 'scale(1.4) translateY(-6px)' : 'scale(1) translateY(0)',
               }}
               onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.transform = 'scale(1.2) translateY(-4px)'; }}
               onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.transform = 'scale(1) translateY(0)'; }}
               >
                 <MapPin size={32} strokeWidth={isSelected ? 2.5 : 1.5} fill="currentColor" color="white" />
               </div>
             </Marker>
           );
        })}
      </Map>

    </div>
  );
}
