import { MapContainer, TileLayer, useMap, Marker, Popup } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import WardLayer from "./WardLayer";
import SustainabilityLayer from "./SustainabilityLayer";
import { buildMergedWards } from "./wardAggregation";
import { useNavigate } from "react-router-dom";

// Helper to fix resize issues
function MapResizer({ setZoom }) {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => { map.invalidateSize(); }, 500);
    const onZoom = () => setZoom(map.getZoom());
    map.on('zoomend', onZoom);
    return () => map.off('zoomend', onZoom);
  }, [map, setZoom]);
  return null;
}

export default function LeafletMap({ center, data: items = [], onAreaClick, type = 'issues' }) {
  const [wards, setWards] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("/data/wards.geojson")
      .then((res) => res.json())
      .then((data) => setWards(data))
      .catch((err) => console.error("GeoJSON Load Error:", err));
  }, []);

  const aggregatedData = useMemo(() => {
    if (!wards) return { zones: null, markers: [] };
    const base = buildMergedWards(wards, 22);
    
    const markersWithCounts = base.markers.map(m => ({ 
      ...m, 
      count: 0,
      latSum: 0,
      lngSum: 0
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
      const finalCenter = m.count > 0 
        ? [m.latSum / m.count, m.lngSum / m.count]
        : m.center;

      return {
        ...m,
        center: finalCenter,
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

  const [zoom, setZoom] = useState(11);
  const mapCenter = center ? [center.lat, center.lng] : [12.9716, 77.5946];

  // Icons
  const issueIcon = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const eventIcon = new L.divIcon({
    html: '<span style="font-size: 32px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));">📍</span>',
    className: 'custom-div-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });

  const activeIcon = type === 'issues' ? issueIcon : eventIcon;

  const renderMarkers = () => {
    const markers = items.map((item) => {
      if (!item.location?.coordinates) return null;
      const [lng, lat] = item.location.coordinates;
      return (
        <Marker 
          key={item._id} 
          position={[lat, lng]} 
          icon={activeIcon}
          eventHandlers={{
            click: () => {
              if (onAreaClick) {
                onAreaClick(lat, lng, item.title);
              } else {
                navigate(`/${type === 'issues' ? 'feed' : 'events'}?id=${item._id}`);
              }
            }
          }}
        >
          <Popup>
            <div style={{ minWidth: '180px', fontFamily: 'Inter, sans-serif' }}>
              <h4 style={{ margin: '0 0 4px', color: '#00e5a0' }}>{item.title}</h4>
              <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#666' }}>{item.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                <span style={{ textTransform: 'uppercase', fontWeight: 800 }}>{item.category}</span>
                <span style={{ color: '#00e5a0' }}>{item.status?.toUpperCase() || (type === 'events' ? 'UPCOMING' : 'OPEN')}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });

    if (type === 'issues') {
      return (
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={30}
          showCoverageOnHover={false}
          iconCreateFunction={(cluster) => {
            const count = cluster.getChildCount();
            return L.divIcon({
              html: `<div class="custom-cluster-icon" style="background: rgba(0, 229, 160, 0.9)"><span>${count}</span></div>`,
              className: 'marker-cluster-custom',
              iconSize: L.point(40, 40, true),
            });
          }}
        >
          {markers}
        </MarkerClusterGroup>
      );
    }

    return markers; // No cluster for events
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#080808' }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <MapResizer setZoom={setZoom} />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
          attribution='&copy; CARTO'
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
          attribution=''
          className="leaflet-labels-layer"
        />
        
        {/* Issues: WardLayer at low zoom, clusters at high zoom */}
        {type === 'issues' && zoom < 14 && aggregatedData.zones && (
          <WardLayer 
            data={aggregatedData.zones} 
            markers={aggregatedData.markers} 
            onAreaClick={onAreaClick}
          />
        )}
        {type === 'issues' && zoom >= 14 && renderMarkers()}

        {/* Events: individual pins at ALL zoom levels */}
        {type === 'events' && renderMarkers()}

        {/* Sustainability: eco-score choropleth at all zoom levels */}
        {type === 'sustainability' && aggregatedData.zones && (
          <SustainabilityLayer
            data={aggregatedData.zones}
            onAreaClick={onAreaClick}
          />
        )}
      </MapContainer>

      {/* Sustainability Legend */}
      {type === 'sustainability' && (
        <div style={{
          position: 'absolute', bottom: 32, right: 16, zIndex: 1000,
          background: 'rgba(11,15,26,0.88)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
          padding: '14px 16px', minWidth: 180,
          boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>Eco Performance</div>
          {[
            { color: '#16a34a', label: 'Excellent', range: '80–100' },
            { color: '#4ade80', label: 'Good',      range: '65–79' },
            { color: '#facc15', label: 'Average',   range: '50–64' },
            { color: '#f97316', label: 'Poor',      range: '35–49' },
            { color: '#ef4444', label: 'Critical',  range: '0–34'  },
          ].map(({ color, label, range }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#fff', fontWeight: 600, flex: 1 }}>{label}</span>
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{range}</span>
            </div>
          ))}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: 9, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>
            Score = Resolution Rate (70%) +<br />Speed Score (30%)
          </div>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000, fontSize: '10px', color: '#555' }}>
        MAP_ENGINE: LEAFLET_V1 | MODE: {type.toUpperCase()} | UPLINK: {wards ? 'STABLE' : 'CONNECTING'}
      </div>
    </div>
  );
}
