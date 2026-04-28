const DEFAULT_ZONE_COUNT = 22;

function getFeatureCentroid(feature) {
  const geometry = feature.geometry;

  if (!geometry) {
    return [0, 0];
  }

  const coordinates = geometry.type === "Polygon"
    ? geometry.coordinates.flat()
    : geometry.coordinates.flat(2);

  let sumX = 0;
  let sumY = 0;
  let count = 0;

  coordinates.forEach(([x, y]) => {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      sumX += x;
      sumY += y;
      count += 1;
    }
  });

  if (!count) {
    return [0, 0];
  }

  return [sumX / count, sumY / count];
}

function seedCenters(points, clusterCount) {
  const step = Math.max(1, Math.floor(points.length / clusterCount));
  const centers = [];

  for (let i = 0; i < clusterCount; i += 1) {
    const point = points[Math.min(i * step, points.length - 1)];
    centers.push([point[0], point[1]]);
  }

  return centers;
}

function nearestCenter(point, centers) {
  let bestIndex = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  centers.forEach((center, index) => {
    const dx = point[0] - center[0];
    const dy = point[1] - center[1];
    const distance = dx * dx + dy * dy;

    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

function kMeans(points, clusterCount, maxIterations = 20) {
  if (points.length <= clusterCount) {
    return points.map((_, index) => index);
  }

  const centers = seedCenters(points, clusterCount);
  const assignments = new Array(points.length).fill(0);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let changed = false;

    points.forEach((point, pointIndex) => {
      const nearest = nearestCenter(point, centers);
      if (assignments[pointIndex] !== nearest) {
        assignments[pointIndex] = nearest;
        changed = true;
      }
    });

    const sums = new Array(clusterCount).fill(null).map(() => ({ x: 0, y: 0, n: 0 }));

    points.forEach((point, pointIndex) => {
      const cluster = assignments[pointIndex];
      sums[cluster].x += point[0];
      sums[cluster].y += point[1];
      sums[cluster].n += 1;
    });

    sums.forEach((sum, cluster) => {
      if (sum.n > 0) {
        centers[cluster] = [sum.x / sum.n, sum.y / sum.n];
      }
    });

    if (!changed) {
      break;
    }
  }

  return assignments;
}

export function buildMergedWards(geojson, targetZoneCount = DEFAULT_ZONE_COUNT) {
  if (!geojson?.features?.length) {
    return { zones: null, markers: [] };
  }

  const zoneCount = Math.max(
    20,
    Math.min(25, Math.min(targetZoneCount, geojson.features.length)),
  );

  const centroids = geojson.features.map(getFeatureCentroid);
  const assignments = kMeans(centroids, zoneCount);

  const zoneStats = new Map();

  const zones = {
    ...geojson,
    features: geojson.features.map((feature, index) => {
      const zoneId = assignments[index] + 1;

      if (!zoneStats.has(zoneId)) {
        zoneStats.set(zoneId, {
          zoneId,
          wardCount: 0,
          wardNames: [],
          wardNumbers: [],
          x: 0,
          y: 0,
        });
      }

      const zone = zoneStats.get(zoneId);
      zone.wardCount += 1;
      zone.x += centroids[index][0];
      zone.y += centroids[index][1];

      if (feature.properties?.KGISWardName) {
        zone.wardNames.push(feature.properties.KGISWardName);
      }
      if (feature.properties?.KGISWardNo) {
        zone.wardNumbers.push(Number(feature.properties.KGISWardNo));
      }

      return {
        ...feature,
        properties: {
          ...feature.properties,
          zone_id: zoneId,
          zone_name: `Zone ${zoneId}`,
          score: (zoneId * 29) % 100,
        },
      };
    }),
  };

  const markers = Array.from(zoneStats.values()).map((zone) => ({
    zoneId: zone.zoneId,
    center: [zone.y / zone.wardCount, zone.x / zone.wardCount],
    wardCount: zone.wardCount,
    score: (zone.zoneId * 29) % 100,
    wardNames: zone.wardNames,
    wardNumbers: zone.wardNumbers.filter((wardNo) => Number.isFinite(wardNo)),
  }));

  const detailsByZone = new Map(markers.map((zone) => [zone.zoneId, zone]));

  zones.features = zones.features.map((feature) => {
    const details = detailsByZone.get(feature.properties.zone_id);
    const wardNumbers = details?.wardNumbers ?? [];
    const minWardNumber = wardNumbers.length ? Math.min(...wardNumbers) : 0;
    const maxWardNumber = wardNumbers.length ? Math.max(...wardNumbers) : 0;
    const averageWardNumber = wardNumbers.length
      ? (wardNumbers.reduce((sum, value) => sum + value, 0) / wardNumbers.length).toFixed(1)
      : "0.0";

    return {
      ...feature,
      properties: {
        ...feature.properties,
        ward_count: details?.wardCount ?? 0,
        ward_number_min: minWardNumber,
        ward_number_max: maxWardNumber,
        ward_number_avg: averageWardNumber,
      },
    };
  });

  return {
    zones,
    markers,
  };
}
