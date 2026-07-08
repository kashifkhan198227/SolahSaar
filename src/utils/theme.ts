// Solah Saar (Sholo Gutti) — carved-wood board theme

export const COLORS = {
  // ── Board ──────────────────────────────────────────────────────────────
  boardBackground: '#1B2A1E',   // deep forest wood
  boardLines: '#FFFFFF',        // white board lines
  nodeIdle: '#3A4A34',
  nodeHighlight: '#4CAF50',

  // ── Soldiers ───────────────────────────────────────────────────────────
  // Keys stay 'orange'/'black' (matching the PlayerColor rules terminology)
  // but render as red/blue pawns.
  orange: '#E53935',
  orangeLight: '#EF5350',
  black: '#1E88E5',
  blackLight: '#42A5F5',
  blackRing: '#90CAF9',

  // ── UI chrome ──────────────────────────────────────────────────────────
  primary: '#C8962A',
  primaryLight: '#D4AF3A',
  background: '#0D0F0A',
  surface: '#141C11',
  surfaceElevated: '#1E2A19',
  card: '#1E2A19',

  // ── Text ───────────────────────────────────────────────────────────────
  textPrimary: '#F0EAD6',
  textSecondary: '#B7C4A9',
  textMuted: '#6E7A63',

  // ── Status ───────────────────────────────────────────────────────────────
  success: '#4CAF50',
  warning: '#FDD835',
  error: '#E53935',

  legalMove: '#4CAF50',
  captureMove: '#E53935',
  selected: '#C8962A',
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const BORDER_RADIUS = { sm: 4, md: 8, lg: 16, xl: 24, round: 999 };
