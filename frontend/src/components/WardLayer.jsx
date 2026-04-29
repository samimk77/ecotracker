import { CircleMarker, GeoJSON, Tooltip, Marker } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from 'leaflet';

function getColor(score, hideColors) {
  if (hideColors) return "rgba(148, 163, 184, 0.2)";
  if (score >= 80) return "#22c55e"; // Green
  if (score >= 60) return "#84cc16"; // Light Green
  if (score >= 40) return "#f97316"; // Orange
  return "#ef4444"; // Red
}

const pinIcon = new L.divIcon({
  html: '<span style="font-size: 32px;">📍</span>',
  className: 'custom-div-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

function styleFeature(feature, hideColors) {
  const score = feature.properties?.score ?? 50;
  return {
    fillColor: getColor(score, hideColors),
    fillOpacity: hideColors ? 0.05 : 0.28,
    color: "#94a3b8",
    weight: 1.2,
    opacity: 0.7,
  };
}

function onEachFeature(feature, layer, onAreaClick, navigate, isEventsMode) {
  const properties = feature.properties || {};
  const wardName = properties.KGISWardName || properties.zone_name;

  layer.bindPopup(`
    <div style="min-width: 240px; font-family: Inter, system-ui, sans-serif; color: #fff;">
      <h4 style="margin: 0 0 8px; color: #00e5a0;">${wardName || "Zone"}</h4>
      <div><strong>${isEventsMode ? 'Events' : 'Issues'} in Area:</strong> ${properties.ward_count || 0}</div>
      <div style="margin-top: 6px; font-size: 10px; color: #94a3b8;">TACTICAL_SCAN: ACTIVE</div>
      <div style="margin-top: 10px; font-size: 11px; color: #00e5a0; cursor: pointer; text-decoration: underline;">
        ${onAreaClick ? 'CLICK TO ANALYZE SECTOR' : `CLICK TO VIEW ALL ${isEventsMode ? 'EVENTS' : 'REPORTS'}`}
      </div>
    </div>
  `);

  layer.on({
    mouseover: (e) => {
      e.target.setStyle({ fillOpacity: 0.55, weight: 3, color: "#f8fafc" });
      e.target.bringToFront();
    },
    mouseout: (e) => {
      e.target.setStyle({ fillOpacity: isEventsMode ? 0.05 : 0.28, weight: 1.2, color: "#94a3b8" });
    },
    click: () => {
      const center = layer.getBounds().getCenter();
      if (onAreaClick) {
        onAreaClick(center.lat, center.lng, wardName);
      } else {
        const path = isEventsMode ? '/events' : '/feed';
        if (wardName) {
          navigate(`${path}?ward=${encodeURIComponent(wardName)}`);
        } else {
          navigate(`${path}?lat=${center.lat.toFixed(4)}&lng=${center.lng.toFixed(4)}`);
        }
      }
    },
  });
}

export default function WardLayer({ data, markers, onAreaClick, hideColors = false, isEventsMode = false }) {
  const navigate = useNavigate();
  if (!data) return null;

  return (
    <>
      <GeoJSON 
        data={data} 
        style={(f) => styleFeature(f, hideColors)} 
        onEachFeature={(feature, layer) => onEachFeature(feature, layer, onAreaClick, navigate, isEventsMode)} 
      />

      {markers.map((marker) => {
        if (marker.wardCount <= 0) return null;

        if (isEventsMode) {
          return (
            <Marker
              key={marker.zoneId}
              position={marker.center}
              icon={pinIcon}
              eventHandlers={{
                click: () => {
                  if (onAreaClick) {
                    onAreaClick(marker.center[0], marker.center[1], marker.label || "Sector Overview");
                  } else {
                    navigate(`/events?lat=${marker.center[0].toFixed(4)}&lng=${marker.center[1].toFixed(4)}`);
                  }
                }
              }}
            />
          );
        }

        return (
          <CircleMarker
            key={marker.zoneId}
            center={marker.center}
            radius={18}
            eventHandlers={{
              click: () => {
                if (onAreaClick) {
                  onAreaClick(marker.center[0], marker.center[1], marker.label || "Sector Overview");
                } else {
                  navigate(`/feed?lat=${marker.center[0].toFixed(4)}&lng=${marker.center[1].toFixed(4)}`);
                }
              }
            }}
            pathOptions={{
              color: getColor(marker.score),
              fillColor: getColor(marker.score),
              fillOpacity: 0.4,
              weight: 2,
              cursor: 'pointer'
            }}
          >
            <Tooltip permanent direction="center" className="zone-count-tooltip">
              {marker.wardCount}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </>
  );
}
