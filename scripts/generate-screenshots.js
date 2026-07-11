// Generates promotional store-listing screenshots (portrait, 1080x1920) that
// mirror the real app's board geometry and theme, for use where a device
// screenshot isn't available (see scripts/generate-icons.js for the icon
// pipeline this mirrors).
const sharp = require('sharp');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const OUT_DIR = path.join(ASSETS, 'screenshots');

const COLORS = {
  boardBackground: '#1B2A1E',
  boardLines: '#FFFFFF',
  background: '#0D0F0A',
  surface: '#141C11',
  card: '#1E2A19',
  primary: '#C8962A',
  red: '#E53935',
  redLight: '#EF5350',
  blue: '#1E88E5',
  blueLight: '#42A5F5',
  textPrimary: '#F0EAD6',
  textSecondary: '#B7C4A9',
};

// ── Board geometry (mirrors src/engine/BoardLayout.ts) ─────────────────────
const NODES = {};
for (let row = 0; row <= 4; row++) {
  for (let col = 0; col <= 4; col++) NODES[`g${col}_${row}`] = { x: col, y: row };
}
NODES.tTL = { x: 0, y: -2 };
NODES.tTC = { x: 2, y: -2 };
NODES.tTR = { x: 4, y: -2 };
NODES.tML = { x: 1, y: -1 };
NODES.tMC = { x: 2, y: -1 };
NODES.tMR = { x: 3, y: -1 };
NODES.bBL = { x: 0, y: 6 };
NODES.bBC = { x: 2, y: 6 };
NODES.bBR = { x: 4, y: 6 };
NODES.bML = { x: 1, y: 5 };
NODES.bMC = { x: 2, y: 5 };
NODES.bMR = { x: 3, y: 5 };

const LINES = [
  ['g0_0', 'g1_0', 'g2_0', 'g3_0', 'g4_0'],
  ['g0_1', 'g1_1', 'g2_1', 'g3_1', 'g4_1'],
  ['g0_2', 'g1_2', 'g2_2', 'g3_2', 'g4_2'],
  ['g0_3', 'g1_3', 'g2_3', 'g3_3', 'g4_3'],
  ['g0_4', 'g1_4', 'g2_4', 'g3_4', 'g4_4'],
  ['g0_0', 'g0_1', 'g0_2', 'g0_3', 'g0_4'],
  ['g1_0', 'g1_1', 'g1_2', 'g1_3', 'g1_4'],
  ['g2_0', 'g2_1', 'g2_2', 'g2_3', 'g2_4'],
  ['g3_0', 'g3_1', 'g3_2', 'g3_3', 'g3_4'],
  ['g4_0', 'g4_1', 'g4_2', 'g4_3', 'g4_4'],
  ['g2_0', 'g1_1', 'g0_2'],
  ['g2_0', 'g3_1', 'g4_2'],
  ['g0_2', 'g1_3', 'g2_4'],
  ['g4_2', 'g3_3', 'g2_4'],
  ['tTL', 'tTC', 'tTR'],
  ['tTL', 'tML', 'g2_0'],
  ['tTR', 'tMR', 'g2_0'],
  ['tTC', 'tMC', 'g2_0'],
  ['tML', 'tMC', 'tMR'],
  ['bBL', 'bBC', 'bBR'],
  ['bBL', 'bML', 'g2_4'],
  ['bBR', 'bMR', 'g2_4'],
  ['bBC', 'bMC', 'g2_4'],
  ['bML', 'bMC', 'bMR'],
];

// Mid-game snapshot: a handful of soldiers removed from each side (captured)
// and a couple advanced into the middle row, so the screenshot reads as
// actual gameplay rather than the untouched starting position.
const RED_SOLDIERS = ['tTL', 'tTC', 'tTR', 'tML', 'tMR', 'g0_0', 'g2_0', 'g3_0', 'g4_0', 'g0_1', 'g3_1', 'g1_2', 'g3_2'];
const BLUE_SOLDIERS = ['g0_3', 'g1_3', 'g3_3', 'g4_3', 'g0_4', 'g2_4', 'g3_4', 'g4_4', 'bBL', 'bBR', 'bML', 'bMR', 'g2_2'];
const SELECTED = 'g1_2';
const LEGAL_TARGETS = ['g1_1', 'g0_2'];

const W = 1080, H = 1920;
const UNIT = 195;
const CENTER_X = W / 2;
const HEADER_H = 260;
const px = (n) => CENTER_X + (NODES[n].x - 2) * UNIT;
const py = (n) => HEADER_H + (NODES[n].y + 2) * UNIT;

function boardSvg({ turnLabel, turnColor }) {
  const lineEls = LINES.map((line) => {
    const pts = line.map((n) => `${px(n)},${py(n)}`).join(' ');
    return `<polyline points="${pts}" fill="none" stroke="${COLORS.boardLines}" stroke-width="4" stroke-linecap="round" />`;
  }).join('\n');

  const nodeEls = Object.keys(NODES).map((n) => {
    const isLegal = LEGAL_TARGETS.includes(n);
    return `<circle cx="${px(n)}" cy="${py(n)}" r="${isLegal ? 16 : 7}" fill="${isLegal ? 'none' : '#3A4A34'}" stroke="${isLegal ? COLORS.blue === turnColor ? COLORS.blueLight : '#4CAF50' : 'none'}" stroke-width="${isLegal ? 5 : 0}" stroke-dasharray="${isLegal ? '6 6' : '0'}" />`;
  }).join('\n');

  const pawn = (n, color, ring) => `
    <circle cx="${px(n)}" cy="${py(n)}" r="38" fill="${color}" stroke="${ring || '#00000055'}" stroke-width="${ring ? 6 : 2}" />
    <circle cx="${px(n) - 12}" cy="${py(n) - 12}" r="12" fill="#ffffff33" />
  `;

  const redEls = RED_SOLDIERS.map((n) => pawn(n, COLORS.red, n === SELECTED ? COLORS.primary : null)).join('\n');
  const blueEls = BLUE_SOLDIERS.map((n) => pawn(n, COLORS.blue, n === SELECTED ? COLORS.primary : null)).join('\n');

  return `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${COLORS.background}" />
    <rect x="0" y="0" width="${W}" height="${HEADER_H}" fill="${COLORS.surface}" />
    <text x="${CENTER_X}" y="120" font-family="Georgia, 'Times New Roman', serif" font-size="56" font-weight="bold" fill="${COLORS.primary}" text-anchor="middle" letter-spacing="4">SOLAH SAAR</text>
    <text x="${CENTER_X}" y="180" font-family="Arial, sans-serif" font-size="34" font-weight="bold" fill="${turnColor}" text-anchor="middle">${turnLabel}</text>
    <rect x="40" y="${HEADER_H + 30}" width="${W - 80}" height="${H - HEADER_H - 90}" rx="24" fill="${COLORS.boardBackground}" />
    ${lineEls}
    ${nodeEls}
    ${redEls}
    ${blueEls}
  </svg>`;
}

function homeSvg() {
  const btn = (y, label, filled) => `
    <rect x="140" y="${y}" width="${W - 280}" height="150" rx="18" fill="${filled ? COLORS.card : 'transparent'}" stroke="${COLORS.primary}" stroke-width="3" />
    <text x="${CENTER_X}" y="${y + 95}" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="${filled ? COLORS.textPrimary : COLORS.primary}" text-anchor="middle">${label}</text>
  `;
  return `
  <svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="glow" cx="50%" cy="0%" r="70%">
        <stop offset="0%" stop-color="#3a2a12" />
        <stop offset="100%" stop-color="${COLORS.background}" />
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#glow)" />
    <text x="${CENTER_X}" y="560" font-family="Georgia, 'Times New Roman', serif" font-size="86" font-weight="bold" fill="${COLORS.primary}" text-anchor="middle" letter-spacing="8">SOLAH SAAR</text>
    <text x="${CENTER_X}" y="620" font-family="Arial, sans-serif" font-size="36" fill="${COLORS.textSecondary}" text-anchor="middle">Sholo Gutti &#183; Sixteen Soldiers</text>
    ${btn(760, 'New Game', true)}
    ${btn(940, 'Play Online', true)}
    ${btn(1120, 'Rules', false)}
  </svg>`;
}

async function main() {
  await sharp({ create: { width: 1, height: 1, channels: 4, background: '#000' } }).png().toBuffer().catch(() => {});
  const fs = require('fs');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  await sharp(Buffer.from(homeSvg())).png().toFile(path.join(OUT_DIR, '1-home.png'));
  await sharp(Buffer.from(boardSvg({ turnLabel: "Red's Turn", turnColor: COLORS.red }))).png().toFile(path.join(OUT_DIR, '2-board-red-turn.png'));
  await sharp(Buffer.from(boardSvg({ turnLabel: "Blue's Turn", turnColor: COLORS.blue }))).png().toFile(path.join(OUT_DIR, '3-board-blue-turn.png'));

  console.log('Screenshots generated in assets/screenshots/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
