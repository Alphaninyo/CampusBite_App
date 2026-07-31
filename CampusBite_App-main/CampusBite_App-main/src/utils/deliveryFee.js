// Client-side mirror of the backend's deliveryFee.service.js — used only to
// show a live preview in Cart before checkout. The backend recomputes this
// itself (using its own clock and the vendor's stored coordinates) as the
// actual source of truth for what gets charged; this just keeps the on-screen
// total from looking stale while the consumer is still choosing an address.
const DISTANCE_BANDS = [
  { maxKm: 1, fee: 40 },
  { maxKm: 3, fee: 60 },
  { maxKm: Infinity, fee: 90 },
];
const DEFAULT_DISTANCE_FEE = 60;

const PEAK_RANGES = [[12, 14], [18, 20]];
const AFTER_HOURS_RANGE = [22, 6];
const PEAK_SURCHARGE = 15;
const AFTER_HOURS_SURCHARGE = 25;

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

export function getTimeTier(now = new Date()) {
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

export const TIME_TIER_LABEL = {
  normal: 'Normal hours',
  peak: 'Peak hours',
  after_hours: 'After hours',
};

export function previewDeliveryFee({ vendorLat, vendorLng, deliveryLat, deliveryLng, now = new Date() }) {
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
