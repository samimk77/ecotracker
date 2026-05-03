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

export default function LeafletMap({ center, data: items = [], onAreaClick, onItemClick, type = 'issues' }) {
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

  const [selectedId, setSelectedId] = useState(null);

  // Icons
  const getIssueIcon = (id) => {
    const isSelected = id === selectedId;
    const size = isSelected ? 46 : 32;
    return new L.Icon({
      iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
      iconSize: [size, size],
      iconAnchor: [size/2, size],
      className: isSelected ? 'marker-highlighted' : 'marker-normal'
    });
  };

  const getEventIcon = (category, id, itemWard) => {
    const isSelected = id === selectedId;
    // Highlight if explicitly selected OR if its ward matches the globally selected ward
    const isWardHighlighted = window.selectedEventsWard && window.selectedEventsWard !== 'All Sectors' && itemWard === window.selectedEventsWard;
    const finalHighlight = isSelected || isWardHighlighted;
    
    const size = finalHighlight ? 24 : 16;

    return new L.divIcon({
      html: `
        <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; opacity: ${(!window.selectedEventsWard || window.selectedEventsWard === 'All Sectors' || isWardHighlighted) ? 1 : 0.3}; transition: opacity 0.3s ease;">
          <div style="
            width: ${size}px; height: ${size}px;
            background: #3b82f6;
            border: 1.2px solid #fff;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg) ${finalHighlight ? 'translateY(-2.5px) scale(1.05)' : ''};
            box-shadow: ${finalHighlight ? '0 4px 8px rgba(59,130,246,0.4)' : '0 2px 4px rgba(0,0,0,0.3)'};
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            display: flex; align-items: center; justify-content: center;
          ">
            <div style="width: 4px; height: 4px; background: #fff; border-radius: 50%; transform: rotate(45deg);"></div>
          </div>
          ${isSelected ? `
            <div style="
              position: absolute; top: 0; left: 0; width: 100%; height: 100%;
              border-radius: 50%; background: #3b82f6; opacity: 0.25;
              animation: markerPulse 1.5s infinite ease-out;
              z-index: -1;
            "></div>
          ` : ''}
        </div>
      `,
      className: 'custom-event-icon',
      iconSize: [size, size],
      iconAnchor: [size/2, size],
    });
  };

  const renderMarkers = () => {
    const markers = items.map((item) => {
      if (!item.location?.coordinates) return null;
      const [lng, lat] = item.location.coordinates;
      return (
        <Marker 
          key={item._id} 
          position={[lat, lng]} 
          icon={type === 'events' ? getEventIcon(item.category, item._id, item.ward) : getIssueIcon(item._id)}
          eventHandlers={{
            click: () => {
              setSelectedId(item._id);
              if (onItemClick) {
                onItemClick(item);
              } else if (onAreaClick) {
                onAreaClick(lat, lng, item.title);
              } else {
                navigate(`/${type === 'issues' ? 'feed' : 'events'}?id=${item._id}`);
              }
            }
          }}
        />
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
