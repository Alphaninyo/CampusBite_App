export const API_BASE_URL = 'https://campusbite-backend-api.onrender.com';
export const API_URL = `${API_BASE_URL}/api`;

// Images now come back as full Cloudinary URLs, but older records (or any
// legacy relative path) still use a `/uploads/...` form — handle both.
export const resolveImageUrl = (path) => {
  if (!path) return null;
  return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
};

export const COLORS = {
  // ── Brand ──────────────────────────────────────────────────
  primary:        '#E85D04',   // Flame Orange
  secondary:      '#FF8A00',   // Light Flame

  // ── Backgrounds ────────────────────────────────────────────
  background:     '#FFF8F6',   // Warm off-white (main app screens)
  backgroundAlt:  '#FFF5F0',   // Auth screens / alternate warm white
  card:           '#FFFFFF',   // Surface / card background
  inputBg:        '#F8F9FA',   // Input field background
  iconBg:         '#FFF0EB',   // Icon container background
  blob:           '#FDDCC8',   // Decorative blob elements

  // ── Text ───────────────────────────────────────────────────
  text:           '#111827',   // Primary text (on light backgrounds)
  subtext:        '#6B7280',   // Secondary / muted text
  muted:          '#9CA3AF',   // Placeholder / very muted

  // ── Borders & Dividers ─────────────────────────────────────
  border:         '#F0F0F0',   // Standard light border
  borderWarm:     '#F3E8E2',   // Warm divider / border
  borderAccent:   '#FFD5C0',   // Orange-tinted accent border

  // ── Monochrome ─────────────────────────────────────────────
  white:          '#FFFFFF',
  black:          '#000000',

  // ── Status / Semantic ──────────────────────────────────────
  success:        '#10B981',
  successBg:      '#ECFDF5',
  successLight:   '#E8F5E9',
  successBorder:  '#86EFAC',
  successIconBg:  '#DCFCE7',
  successText:    '#166634',

  danger:         '#EF4444',
  dangerBg:       '#FEF2F2',
  dangerBorder:   '#FECACA',

  warning:        '#F59E0B',
  warningBg:      '#FFFBEB',
  warningBorder:  '#FDE68A',
  warningIconBg:  '#FEF3C7',
  warningText:    '#92400E',
  warningTextMid: '#B45309',

  info:           '#3B82F6',
  infoBg:         '#EFF6FF',
  infoBorder:     '#BFDBFE',
  infoText:       '#1D4ED8',

  // ── Overlay ────────────────────────────────────────────────
  overlay:        'rgba(0,0,0,0.5)',

  // ── Legacy aliases (retained for existing screens that reference these) ──
  gray:           '#6B7280',
  lightGray:      '#F0F0F0',
};

export const DARK_COLORS = {
  // ── Brand ──────────────────────────────────────────────────
  primary:        '#FF7A33',   // Brightened Flame Orange (contrast on dark bg)
  secondary:      '#FFA94D',

  // ── Backgrounds ────────────────────────────────────────────
  background:     '#15100D',   // Near-black warm dark (main app screens)
  backgroundAlt:  '#1B1512',   // Auth screens / alternate dark
  card:           '#211A16',   // Surface / card background
  inputBg:        '#2A211C',   // Input field background
  iconBg:         '#3A2A20',   // Icon container background
  blob:           '#3A2415',   // Decorative blob elements

  // ── Text ───────────────────────────────────────────────────
  text:           '#F5F1EE',   // Primary text (on dark backgrounds)
  subtext:        '#B9AFA8',   // Secondary / muted text
  muted:          '#8A7E77',   // Placeholder / very muted

  // ── Borders & Dividers ─────────────────────────────────────
  border:         '#332922',   // Standard dark border
  borderWarm:     '#3A2C24',   // Warm divider / border
  borderAccent:   '#5A3826',   // Orange-tinted accent border

  // ── Monochrome ─────────────────────────────────────────────
  white:          '#FFFFFF',
  black:          '#000000',

  // ── Status / Semantic ──────────────────────────────────────
  success:        '#34D399',
  successBg:      '#0F2A21',
  successLight:   '#163527',
  successBorder:  '#1F6E4C',
  successIconBg:  '#14352A',
  successText:    '#6EE7B7',

  danger:         '#F87171',
  dangerBg:       '#2C1616',
  dangerBorder:   '#7F1D1D',

  warning:        '#FBBF24',
  warningBg:      '#2B2210',
  warningBorder:  '#78350F',
  warningIconBg:  '#3A2A12',
  warningText:    '#FCD34D',
  warningTextMid: '#F59E0B',

  info:           '#60A5FA',
  infoBg:         '#122236',
  infoBorder:     '#1E3A5F',
  infoText:       '#93C5FD',

  // ── Overlay ────────────────────────────────────────────────
  overlay:        'rgba(0,0,0,0.65)',

  // ── Legacy aliases (retained for existing screens that reference these) ──
  gray:           '#B9AFA8',
  lightGray:      '#332922',
};

export const STATUS_COLORS = {
  'Received':   '#6B7280',
  'Preparing':  '#F59E0B',
  'Ready':      '#3B82F6',
  'Collected':  '#8B5CF6',
  'In Transit': '#E85D04',
  'Delivered':  '#10B981',
};
