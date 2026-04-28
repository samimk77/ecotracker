import { CircleMarker, GeoJSON, Tooltip } from "react-leaflet";

function getColor(score) {
  if (score >= 80) return "#22c55e"; // Green
  if (score >= 60) return "#84cc16"; // Light Green
  if (score >= 40) return "#f97316"; // Orange
  return "#ef4444"; // Red
}

function styleFeature(feature) {
  const score = feature.properties?.score ?? 50;
  return {
    fillColor: getColor(score),
    fillOpacity: 0.28,
    color: "#94a3b8",
    weight: 1.2,
    opacity: 0.7,
  };
}

function onEachFeature(feature, layer) {
  const properties = feature.properties || {};
  layer.bindPopup(`
    <div style="min-width: 240px; font-family: Inter, system-ui, sans-serif; color: #fff;">
      <h4 style="margin: 0 0 8px; color: var(--color-primary);">${properties.zone_name || "Zone"}</h4>
      <div><strong>Issues in Area:</strong> ${properties.ward_count || 0}</div>
      <div style="margin-top: 6px; font-size: 10px; color: #94a3b8;">RADIUS_SCAN: ACTIVE</div>
    </div>
  `);

  layer.on({
    mouseover: (e) => {
      e.target.setStyle({
        fillOpacity: 0.55,
        weight: 3,
        color: "#f8fafc",
      });
      e.target.bringToFront();
    },
    mouseout: (e) => {
      e.target.setStyle({
        fillOpacity: 0.28,
        weight: 1.2,
        color: "#94a3b8",
      });
      layer.closePopup();
    },
    click: () => {
      layer.openPopup();
    },
  });
}

export default function WardLayer({ data, markers }) {
  if (!data) return null;

  return (
    <>
      <GeoJSON data={data} style={styleFeature} onEachFeature={onEachFeature} />

      {markers.map((marker) => (
        <CircleMarker
          key={marker.zoneId}
          center={marker.center}
          radius={18}
          pathOptions={{
            color: getColor(marker.score),
            fillColor: getColor(marker.score),
            fillOpacity: 0.4,
            weight: 2,
          }}
        >
          <Tooltip permanent direction="center" className="zone-count-tooltip">
            {marker.wardCount}
          </Tooltip>
        </CircleMarker>
      ))}
    </>
  );
}
