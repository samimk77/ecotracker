import React, { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Source, Layer, NavigationControl, Marker, Popup } from 'react-map-gl/mapbox';
import { buildMergedWards } from './wardAggregation';
import { useNavigate } from 'react-router-dom';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Activity, Info, Trash2, Database, Truck, Navigation, X, AlertTriangle, CheckCircle, Clock, BarChart2, Sparkles } from 'lucide-react';
import api from '../api';
import { io } from 'socket.io-client';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

function getColor(score) {
  if (score >= 80) return "#10b981"; // Emerald
  if (score >= 60) return "#f59e0b"; // Amber
  if (score >= 40) return "#f43f5e"; // Rose
  return "#be123c"; // Dark Rose
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

        setFleetRoute(res.data.route);
        animateTruck(res.data.route);
      } else {
        alert("All sectors clear. No collection required.");
      }
    } catch (err) {
      console.error('Fleet Deployment Error:', err);
    }
  };

  const animateTruck = (route) => {
    setIsDeploying(true);
    let currentWaypoint = 0;
    let progress = 0;
    
    // Start from Bangalore Center Depot
    const depotPos = [77.5946, 12.9716];
    
    const step = () => {
      const start = currentWaypoint === 0 ? depotPos : route[currentWaypoint - 1].coords;
      const end = route[currentWaypoint].coords;
      
      const lng = start[0] + (end[0] - start[0]) * progress;
      const lat = start[1] + (end[1] - start[1]) * progress;
      
      setTruckPos({ lng, lat });
      
      progress += 0.03; // Increased speed (was 0.01)
      
      if (progress >= 1) {
        progress = 0;
        currentWaypoint++;
      }
      
      if (currentWaypoint < route.length) {
        requestAnimationFrame(step);
      } else {
        // Animation finished
        setTimeout(async () => {
          setIsDeploying(false);
          setFleetRoute(null);
          setTruckPos(null);
          
          // Identify only the bins that were on this route
          const cleanedBinIds = route.filter(p => p.type === 'bin').map(p => p.id);

          // Rapidly update local UI state for specific bins only
          setBins(prev => prev.map(b => 
            cleanedBinIds.includes(b.binId) ? { ...b, fillLevel: 0, status: 'normal' } : b
          ));

          // Reset specific bins on the backend
          try {
            await api.post('/iot/reset', { binIds: cleanedBinIds });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
          } catch (err) {
            console.error('Reset Bins Error:', err);
          }
        }, 500);
      }
    };
    
    requestAnimationFrame(step);
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
      const dynamicScore = type === 'issues' ? Math.max(10, 100 - (m.count * 15)) : 100;
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
      'fill-extrusion-color': ['get', 'color'],
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': 0,
      'fill-extrusion-opacity': (showBins || isDeploying) ? 0.2 : 0.5, 
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
        const score = f.properties.score || 100;
        const count = f.properties.ward_count || 0;
        const height = type === 'issues' ? (count * 200) : (score * 15);
        return {
          ...f,
          properties: {
            ...f.properties,
            color: getColor(score),
            height: height
          }
        };
      })
    };
  }, [aggregatedData.zones, type]);
  
  // ── Theme Configuration (Forced Dark) ──
  const isDay = false;
  const mapStyle = 'mapbox://styles/mapbox/dark-v11';
  const fogColor = '#242b3b';

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

  const onMapClick = (e) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      if (onAreaClick) {
        onAreaClick(e.lngLat.lat, e.lngLat.lng, feature.properties.zone_name || "Sector");
      }
    }
  };

  const activeMode = showBins ? 'bins' : isDeploying ? 'fleet' : 'live';

  const modeConfig = {
    live:     { label: 'Live Feed',    icon: Activity,  color: '#00e5a0', bg: 'rgba(0,229,160,0.12)',  border: 'rgba(0,229,160,0.3)',  desc: 'Real-time environmental issues reported by citizens across the city.' },

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
          background: 'rgba(8,14,26,0.92)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16,
          padding: '14px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart2 size={14} color="#3b82f6" />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#e2e8f0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>IoT Dashboard</div>
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{binStats.total} sensors active</div>
            </div>
          </div>

          {/* City capacity bar */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>City Capacity Used</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: binStats.avg > 70 ? '#ef4444' : binStats.avg > 50 ? '#eab308' : '#22c55e' }}>{binStats.avg}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ width: `${binStats.avg}%`, height: '100%', borderRadius: 99, background: binStats.avg > 70 ? 'linear-gradient(90deg,#ef4444,#b91c1c)' : binStats.avg > 50 ? 'linear-gradient(90deg,#eab308,#ca8a04)' : 'linear-gradient(90deg,#22c55e,#16a34a)', transition: 'width 1s ease' }} />
            </div>
          </div>

          {/* Status breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Full (≥90%)', count: binStats.full, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', Icon: AlertTriangle },
              { label: 'Warning (≥70%)', count: binStats.warning, color: '#eab308', bg: 'rgba(234,179,8,0.1)', Icon: Clock },
              { label: 'OK (<70%)', count: binStats.ok, color: '#22c55e', bg: 'rgba(34,197,94,0.1)', Icon: CheckCircle },
            ].map(({ label, count, color, bg, Icon: IC }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: bg, borderRadius: 10, border: `1px solid ${color}22` }}>
                <IC size={12} color={color} />
                <span style={{ flex: 1, fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color }}>{count}</span>
                {/* Mini bar */}
                <div style={{ width: 28, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ width: `${binStats.total ? (count / binStats.total) * 100 : 0}%`, height: '100%', background: color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Divider + last update */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 9, color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: 4 }}>
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
                border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.07)'}`,
                background: isActive ? `rgba(${color === '#00e5a0' ? '0,229,160' : color === '#a855f7' ? '168,85,247' : '59,130,246'},0.15)` : 'rgba(10,15,24,0.85)',
                backdropFilter: 'blur(12px)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? `0 0 16px ${color}2a` : 'none',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: 8,
                background: isActive ? color : 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease',
              }}>
                <Icon size={13} color={isActive ? '#000' : color} strokeWidth={2.5} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: isActive ? color : '#e2e8f0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {modeConfig[mode].label}
                </div>
                {isActive && (
                  <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 1.3 }}>
                    {modeConfig[mode].desc}
                  </div>
                )}
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
            border: `1px solid ${isDeploying ? '#f97316' : 'rgba(249,115,22,0.3)'}`,
            background: isDeploying ? 'rgba(249,115,22,0.25)' : 'rgba(10,15,24,0.85)',
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
            {isDeploying && (
              <div style={{ fontSize: 8.5, color: 'rgba(253,186,116,0.6)', marginTop: 2, lineHeight: 1.3 }}>
                {modeConfig.fleet.desc}
              </div>
            )}
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
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
        interactiveLayerIds={['ward-extrusion']}
        onClick={onMapClick}
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
        
        {mapboxZones && (
          <Source id="wards" type="geojson" data={mapboxZones}>
            <Layer {...extrusionLayer} />
            <Layer {...lineLayer} />
          </Source>
        )}

        {fleetRoute && (
          <Source id="route" type="geojson" data={{
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: [[77.5946, 12.9716], ...fleetRoute.map(r => r.coords)]
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
            <div style={{ padding: 0, fontFamily: 'Inter, sans-serif', width: 200, background: 'rgba(8,14,26,0.97)', borderRadius: 12, border: '1px solid rgba(59,130,246,0.25)', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.7)' }}>
              {/* Header */}
              {(() => {
                const fill = Math.round(selectedBin.fillLevel);
                const isFull = fill >= 90;
                const isWarn = fill >= 70;
                const color = isFull ? '#ef4444' : isWarn ? '#eab308' : '#22c55e';
                const statusLabel = isFull ? 'FULL' : isWarn ? 'WARNING' : 'OK';
                return (
                  <>
                    <div style={{ background: `${color}18`, padding: '10px 12px', borderBottom: `1px solid ${color}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Trash2 size={13} color={color} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#f1f5f9' }}>{selectedBin.binId}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color, background: `${color}20`, padding: '2px 7px', borderRadius: 99, border: `1px solid ${color}44` }}>{statusLabel}</span>
                        <button onClick={() => setSelectedBin(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, lineHeight: 1 }}><X size={12} /></button>
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Fill bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fill Level</span>
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
           return (
             <Marker 
               key={item._id} 
               longitude={lng} 
               latitude={lat}
               anchor="bottom"
               onClick={e => {
                 e.originalEvent.stopPropagation();
                 setSelectedItem(item);
                 if (onAreaClick) onAreaClick(lat, lng, item.title);
               }}
             >
               <div style={{
                 color: type === 'events' ? '#60a5fa' : '#f87171',
                 filter: type === 'events' ? 'drop-shadow(0 0 8px rgba(96,165,250,0.8))' : 'drop-shadow(0 0 8px rgba(248,113,113,0.8))',
                 cursor: 'pointer',
                 transition: 'transform 0.2s ease-in-out',
               }}
               onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2) translateY(-4px)'}
               onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
               >
                 <MapPin size={32} strokeWidth={1.5} fill="currentColor" color="white" />
               </div>
             </Marker>
           );
        })}

        {selectedItem && selectedItem.location && (
          <Popup
            longitude={selectedItem.location.coordinates[0]}
            latitude={selectedItem.location.coordinates[1]}
            anchor="bottom"
            offset={16}
            onClose={() => setSelectedItem(null)}
            closeButton={false}
          >
            <div style={{ padding: '12px', fontFamily: 'Inter, sans-serif', maxWidth: '220px', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', color: 'white', backdropFilter: 'blur(8px)' }}>
              <h4 style={{ margin: '0 0 6px', color: '#f8fafc', fontWeight: '600', fontSize: '14px' }}>{selectedItem.title}</h4>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>{selectedItem.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', alignItems: 'center' }}>
                <span style={{ textTransform: 'uppercase', fontWeight: 600, color: type === 'events' ? '#60a5fa' : '#f87171', letterSpacing: '0.5px' }}>{selectedItem.category}</span>
                <span style={{ cursor: 'pointer', color: '#38bdf8', textDecoration: 'none', fontWeight: 500, padding: '4px 8px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '4px', transition: 'background 0.2s' }} 
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.2)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)'}
                      onClick={() => navigate(`/${type === 'issues' ? 'feed' : 'events'}?id=${selectedItem._id}`)}>
                  VIEW DETAILS
                </span>
              </div>
            </div>
          </Popup>
        )}
      </Map>

    </div>
  );
}
