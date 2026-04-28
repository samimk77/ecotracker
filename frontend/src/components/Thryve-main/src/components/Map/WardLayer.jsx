import { CircleMarker, GeoJSON, Tooltip } from "react-leaflet";

function getColor(score) {
  if (score >= 80) return "#22c55e";
  if (score >= 60) return "#84cc16";
  if (score >= 40) return "#f97316";
  return "#ef4444";
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
    <div style="min-width: 240px; font-family: Inter, system-ui, sans-serif;">
      <h4 style="margin: 0 0 8px;">${properties.zone_name || "Zone"}</h4>
      <div><strong>Total wards merged:</strong> ${properties.ward_count || 0}</div>
      <div style="margin-top: 6px;"><strong>Ward number span:</strong> ${properties.ward_number_min ?? 0} - ${properties.ward_number_max ?? 0}</div>
      <div style="margin-top: 6px;"><strong>Average ward number:</strong> ${properties.ward_number_avg ?? "0.0"}</div>
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
      console.log("Merged ward zone:", properties);
    },
  });
}

export default function WardLayer({ data, markers }) {
  if (!data) {
    return null;
  }

  return (
    <>
      <GeoJSON data={data} style={styleFeature} onEachFeature={onEachFeature} />

      {markers.map((marker) => (
        <CircleMarker
          key={marker.zoneId}
          center={marker.center}
          radius={16}
          pathOptions={{
            color: getColor(marker.score),
            fillColor: getColor(marker.score),
            fillOpacity: 0.35,
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
