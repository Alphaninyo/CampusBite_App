// Delivery fee = distance band fee + time-of-day surcharge.
//
// Distance bands (straight-line vendor -> drop-off pin, in km):
//   0–1km   -> KES 40
//   1–3km   -> KES 60
//   3km+    -> KES 90
// If either side lacks coordinates, DEFAULT_DISTANCE_FEE is used instead of
// guessing — this happens whenever a vendor hasn't set their shop pin yet,
// or a consumer typed their address instead of using the map picker.
const DISTANCE_BANDS = [
  { maxKm: 1, fee: 40 },
  { maxKm: 3, fee: 60 },
  { maxKm: Infinity, fee: 90 },
];
const DEFAULT_DISTANCE_FEE = 60;

// Peak: lunch (12:00-14:00) and dinner (18:00-20:00) rush — more orders per
// courier, so a small surcharge. After Hours: 22:00-06:00 — fewer couriers
// on duty, bigger surcharge. Everything else is Normal, no surcharge.
const PEAK_RANGES = [[12, 14], [18, 20]];
const AFTER_HOURS_RANGE = [22, 6]; // wraps midnight
const PEAK_SURCHARGE = 15;
const AFTER_HOURS_SURCHARGE = 25;

/** Straight-line distance between two lat/lng points, in km. */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function distanceBandFee(distanceKm) {
  if (distanceKm == null) return DEFAULT_DISTANCE_FEE;
  return DISTANCE_BANDS.find((b) => distanceKm <= b.maxKm).fee;
}

function getTimeTier(now = new Date()) {
  const hour = now.getHours();
  if (PEAK_RANGES.some(([start, end]) => hour >= start && hour < end)) return 'peak';
  const [ahStart, ahEnd] = AFTER_HOURS_RANGE;
  if (hour >= ahStart || hour < ahEnd) return 'after_hours';
  return 'normal';
}

function timeTierSurcharge(tier) {
  if (tier === 'peak') return PEAK_SURCHARGE;
  if (tier === 'after_hours') return AFTER_HOURS_SURCHARGE;
  return 0;
}

/**
 * @param {object} params
 * @param {number|null} params.vendorLat
 * @param {number|null} params.vendorLng
 * @param {number|null} params.deliveryLat
 * @param {number|null} params.deliveryLng
 * @param {Date} [params.now]
 * @returns {{ delivery_fee: number, distance_km: number|null, time_tier: string }}
 */
function calculateDeliveryFee({ vendorLat, vendorLng, deliveryLat, deliveryLng, now = new Date() }) {
  let distanceKm = null;
  if (vendorLat != null && vendorLng != null && deliveryLat != null && deliveryLng != null) {
    distanceKm = parseFloat(
      haversineKm(parseFloat(vendorLat), parseFloat(vendorLng), parseFloat(deliveryLat), parseFloat(deliveryLng)).toFixed(2)
    );
  }

  const time_tier = getTimeTier(now);
  const delivery_fee = distanceBandFee(distanceKm) + timeTierSurcharge(time_tier);

  return { delivery_fee, distance_km: distanceKm, time_tier };
}

module.exports = {
  calculateDeliveryFee,
  haversineKm,
  getTimeTier,
  distanceBandFee,
  timeTierSurcharge,
  DISTANCE_BANDS,
  DEFAULT_DISTANCE_FEE,
  PEAK_SURCHARGE,
  AFTER_HOURS_SURCHARGE,
};
