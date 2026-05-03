import { GeoJSON, Tooltip } from "react-leaflet";

/* ─── Mock sustainability data per zone (1–22) ─── */
const MOCK_SUSTAINABILITY = {
  1:  { resolutionRate: 91, avgDays: 1.4,  label: 'Cubbon Park Sector' },
  2:  { resolutionRate: 43, avgDays: 8.2,  label: 'Shivajinagar' },
  3:  { resolutionRate: 78, avgDays: 2.9,  label: 'Indiranagar' },
  4:  { resolutionRate: 22, avgDays: 14.5, label: 'Whitefield Outer' },
  5:  { resolutionRate: 66, avgDays: 4.1,  label: 'Koramangala' },
  6:  { resolutionRate: 88, avgDays: 1.8,  label: 'Lalbagh Sector' },
  7:  { resolutionRate: 31, avgDays: 12.3, label: 'Anekal Fringe' },
  8:  { resolutionRate: 54, avgDays: 6.0,  label: 'JP Nagar' },
  9:  { resolutionRate: 95, avgDays: 0.9,  label: 'Rajajinagar' },
  10: { resolutionRate: 48, avgDays: 7.5,  label: 'Bannerghatta Rd' },
  11: { resolutionRate: 74, avgDays: 3.3,  label: 'Malleshwaram' },
  12: { resolutionRate: 18, avgDays: 18.0, label: 'Electronic City' },
  13: { resolutionRate: 83, avgDays: 2.2,  label: 'Hebbal' },
  14: { resolutionRate: 37, avgDays: 10.7, label: 'Bellandur' },
  15: { resolutionRate: 62, avgDays: 5.0,  label: 'Ulsoor Sector' },
  16: { resolutionRate: 90, avgDays: 1.5,  label: 'Sadashivanagar' },
  17: { resolutionRate: 29, avgDays: 13.0, label: 'Sarjapur Outskirts' },
  18: { resolutionRate: 71, avgDays: 3.8,  label: 'Yeshwanthpur' },
  19: { resolutionRate: 55, avgDays: 5.8,  label: 'Nagavara' },
  20: { resolutionRate: 85, avgDays: 2.0,  label: 'Yelahanka' },
  21: { resolutionRate: 40, avgDays: 9.5,  label: 'Kengeri' },
  22: { resolutionRate: 68, avgDays: 4.4,  label: 'HSR Layout' },
};

/* ─── Composite score: weight resolution rate 70%, speed 30% ─── */
function computeScore(zoneId) {
  const d = MOCK_SUSTAINABILITY[zoneId];
  if (!d) return 50;
  // Speed score: 0 days = 100, 20+ days = 0
  const speedScore = Math.max(0, 100 - d.avgDays * 5);
  return Math.round(d.resolutionRate * 0.7 + speedScore * 0.3);
}

/* ─── Color scale: Green → Yellow → Red ─── */
function getColor(score) {
  if (score >= 75) return '#00e5a0';  // Green (EcoImpact Primary)
  if (score >= 45) return '#f59e0b';  // Orange (Amber)
  return '#ef4444';                   // Red (Rose)
}

function getLabel(score) {
  if (score >= 80) return { text: 'EXCELLENT', color: '#16a34a' };
  if (score >= 65) return { text: 'GOOD',      color: '#4ade80' };
  if (score >= 50) return { text: 'AVERAGE',   color: '#facc15' };
  if (score >= 35) return { text: 'POOR',      color: '#f97316' };
  return                { text: 'CRITICAL',  color: '#ef4444' };
}

function styleFeature(feature) {
  const zoneId = feature.properties?.zone_id;
  const score  = computeScore(zoneId);
  const color  = getColor(score);
  return {
    fillColor:   color,
    fillOpacity: 0.45,
    color:       color,
    weight:      1.5,
    opacity:     0.7,
  };
}

function onEachFeature(feature, layer, onAreaClick) {
  const zoneId   = feature.properties?.zone_id;
  const data     = MOCK_SUSTAINABILITY[zoneId] || { resolutionRate: 50, avgDays: 7, label: 'Sector' };
  const score    = computeScore(zoneId);
  const { text: perfText, color: perfColor } = getLabel(score);
  const zoneName = data.label || feature.properties?.zone_name || `Sector ${zoneId}`;

  // Sustainability popups removed for a cleaner, sidebar-focused UI.

  layer.on({
    mouseover: (e) => {
      e.target.setStyle({ fillOpacity: 0.7, weight: 2.5 });
      e.target.bringToFront();
    },
    mouseout:  (e) => {
      e.target.setStyle({ fillOpacity: 0.45, weight: 1.5 });
    },
    click: () => {
      const center = layer.getBounds().getCenter();
      if (onAreaClick) onAreaClick(center.lat, center.lng, zoneName, null, zoneId);
    },
  });
}

export default function SustainabilityLayer({ data, onAreaClick }) {
  if (!data) return null;
  return (
    <GeoJSON
      data={data}
      style={styleFeature}
      onEachFeature={(feature, layer) => onEachFeature(feature, layer, onAreaClick)}
    />
  );
}
