// Computes whether a vendor is *effectively* open right now, combining their
// manual is_open toggle with the opening_time/closing_time they've set.
// A vendor who leaves is_open=true stays open only during their set hours and
// auto-closes outside them; manually toggling is_open=false always wins and
// keeps the shop closed regardless of time until they toggle it back on.

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return null;
  const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3] ? match[3].toUpperCase() : null;

  if (hours > 23 || minutes > 59) return null;
  if (meridiem === 'PM' && hours !== 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

// Africa/Nairobi (EAT) is a fixed UTC+3 offset with no DST. Vendors set their
// hours in local Kenya time, so "now" must be computed from that offset, not
// the host machine's own clock/timezone (Render's servers run in UTC).
const NAIROBI_UTC_OFFSET_MINUTES = 180;

function nowMinutesInNairobi(now) {
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return (utcMinutes + NAIROBI_UTC_OFFSET_MINUTES) % 1440;
}

function isWithinBusinessHours(openingTime, closingTime, now = new Date()) {
  const openMin = parseTimeToMinutes(openingTime);
  const closeMin = parseTimeToMinutes(closingTime);

  // Hours not configured yet — don't impose a time restriction.
  if (openMin === null || closeMin === null || openMin === closeMin) return true;

  const nowMin = nowMinutesInNairobi(now);

  if (openMin < closeMin) {
    return nowMin >= openMin && nowMin < closeMin;
  }
  // Overnight range, e.g. opens 6:00 PM, closes 2:00 AM.
  return nowMin >= openMin || nowMin < closeMin;
}

function isVendorOpenNow(vendor) {
  if (!vendor.is_open) return false;
  return isWithinBusinessHours(vendor.opening_time, vendor.closing_time);
}

module.exports = { parseTimeToMinutes, isWithinBusinessHours, isVendorOpenNow };
