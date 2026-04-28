const axios = require('axios');
const Ward = require('../models/Ward');

/**
 * Resolves which Ward a set of coordinates belongs to.
 * First checks DB for a ward whose boundary polygon contains the point.
 * Falls back to Nominatim reverse geocode → fuzzy name match.
 * Returns the Ward document or null.
 */
const resolveWardFromCoords = async (lat, lng) => {
  try {
    // Try geospatial query first (if ward boundaries are loaded)
    const ward = await Ward.findOne({
      boundary: {
        $geoIntersects: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
        },
      },
    });

    if (ward) return ward;

    // Fallback: Nominatim reverse geocode
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json', addressdetails: 1 },
      headers: { 'User-Agent': 'EcoTrack/1.0 (civic-platform)' },
      timeout: 5000,
    });

    const address = response.data?.address;
    if (!address) return null;

    // Try to match ward/suburb/neighbourhood
    const wardName =
      address.ward ||
      address.suburb ||
      address.neighbourhood ||
      address.village ||
      address.town ||
      address.city_district;

    if (!wardName) return null;

    // Find closest ward by name
    const matched = await Ward.findOne({
      name: { $regex: new RegExp(wardName, 'i') },
    });

    return matched || null;
  } catch (err) {
    console.warn('Geocoding failed:', err.message);
    return null;
  }
};

/**
 * Reverse geocode to get a human-readable address string.
 */
const getAddressFromCoords = async (lat, lng) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json' },
      headers: { 'User-Agent': 'EcoTrack/1.0 (civic-platform)' },
      timeout: 5000,
    });
    return response.data?.display_name || '';
  } catch {
    return '';
  }
};

module.exports = { resolveWardFromCoords, getAddressFromCoords };
