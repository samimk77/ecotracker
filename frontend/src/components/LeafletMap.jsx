import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import L from 'leaflet';
import WardLayer from "./WardLayer";
import { buildMergedWards } from "./wardAggregation";

// Helper to fix resize issues
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 500);
  }, [map]);
  return null;
}

export default function LeafletMap({ center, issues = [] }) {
  const [wards, setWards] = useState(null);

  useEffect(() => {
    fetch("/data/wards.geojson")
      .then((res) => res.json())
      .then((data) => setWards(data))
      .catch((err) => console.error("GeoJSON Load Error:", err));
  }, []);

  const data = useMemo(() => {
    if (!wards) return { zones: null, markers: [] };
    const base = buildMergedWards(wards, 22);
    
    const markersWithIssues = base.markers.map(m => ({ ...m, issueCount: 0 }));
    issues.forEach(issue => {
      if (!issue.location?.coordinates) return;
      const [lng, lat] = issue.location.coordinates;
      let closestIdx = 0;
      let minD = Infinity;
      markersWithIssues.forEach((m, idx) => {
        const d = Math.pow(m.center[0] - lat, 2) + Math.pow(m.center[1] - lng, 2);
        if (d < minD) { minD = d; closestIdx = idx; }
      });
      markersWithIssues[closestIdx].issueCount += 1;
    });

    return { zones: base.zones, markers: markersWithIssues };
  }, [wards, issues]);

  const mapCenter = center ? [center.lat, center.lng] : [12.9716, 77.5946];

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#080808' }}>
      <MapContainer
        center={mapCenter}
        zoom={11}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <MapResizer />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png"
          attribution='&copy; CARTO'
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png"
          attribution=''
          className="leaflet-labels-layer"
        />
        
        {data.zones && (
          <WardLayer 
            data={data.zones} 
            markers={data.markers.map(m => ({
              ...m,
              wardCount: m.issueCount > 0 ? m.issueCount : m.wardCount,
              score: m.issueCount > 0 ? 30 : m.score 
            }))} 
          />
        )}
      </MapContainer>
      
      {/* Debug Overlay */}
      <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 1000, fontSize: '10px', color: '#555' }}>
        MAP_ENGINE: LEAFLET_V1 | SECTORS: {data.markers.length} | UPLINK: {wards ? 'STABLE' : 'CONNECTING'}
      </div>
    </div>
  );
}
