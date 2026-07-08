/**
 * Solah Saar (Sholo Gutti / "Sixteen Soldiers") board layout.
 *
 * The board is a 4x4 grid (5x5 = 25 intersections) with an inverted-triangle
 * extension above and a right-way-up triangle extension below, each apex
 * meeting the grid at its top/bottom center point. Every grid quadrant also
 * has an X diagonal. Traced from the user's reference photo of the physical
 * board (see project memory for the ChangaPe-thread history).
 *
 * Node coordinates are abstract grid units; Board.tsx scales them to pixels.
 */

export interface NodeCoord {
  x: number;
  y: number;
}

export const NODES: Record<string, NodeCoord> = {};

// Main 4x4 grid: g{col}_{row}, col/row 0-4
for (let row = 0; row <= 4; row++) {
  for (let col = 0; col <= 4; col++) {
    NODES[`g${col}_${row}`] = { x: col, y: row };
  }
}

// Top inverted triangle (apex meets g2_0). tTL-tML-g2_0-g3_1-g4_2 and
// tTR-tMR-g2_0-g1_1-g0_2 are each one continuous straight diagonal running
// from the triangle's outer corner, through the apex, into the grid.
NODES['tTL'] = { x: 0, y: -2 };
NODES['tTC'] = { x: 2, y: -2 };
NODES['tTR'] = { x: 4, y: -2 };
NODES['tML'] = { x: 1, y: -1 };
NODES['tMC'] = { x: 2, y: -1 };
NODES['tMR'] = { x: 3, y: -1 };

// Bottom triangle (apex meets g2_4), mirrored the same way: bBL-bML-g2_4-g3_3-g4_2
// and bBR-bMR-g2_4-g1_3-g0_2 are each one straight diagonal through the apex.
NODES['bBL'] = { x: 0, y: 6 };
NODES['bBC'] = { x: 2, y: 6 };
NODES['bBR'] = { x: 4, y: 6 };
NODES['bML'] = { x: 1, y: 5 };
NODES['bMC'] = { x: 2, y: 5 };
NODES['bMR'] = { x: 3, y: 5 };

export type NodeId = keyof typeof NODES extends never ? string : string;

/**
 * Every straight line on the board, as an ordered chain of collinear nodes.
 * This is the single source of truth: adjacency (for movement) and
 * jump-triples (for captures) are both derived from these chains, so a
 * capture is always "two consecutive edges on the same line" by construction.
 */
export const LINES: string[][] = [
  // 5 horizontal grid rows
  ['g0_0', 'g1_0', 'g2_0', 'g3_0', 'g4_0'],
  ['g0_1', 'g1_1', 'g2_1', 'g3_1', 'g4_1'],
  ['g0_2', 'g1_2', 'g2_2', 'g3_2', 'g4_2'],
  ['g0_3', 'g1_3', 'g2_3', 'g3_3', 'g4_3'],
  ['g0_4', 'g1_4', 'g2_4', 'g3_4', 'g4_4'],

  // 5 vertical grid columns
  ['g0_0', 'g0_1', 'g0_2', 'g0_3', 'g0_4'],
  ['g1_0', 'g1_1', 'g1_2', 'g1_3', 'g1_4'],
  ['g2_0', 'g2_1', 'g2_2', 'g2_3', 'g2_4'],
  ['g3_0', 'g3_1', 'g3_2', 'g3_3', 'g3_4'],
  ['g4_0', 'g4_1', 'g4_2', 'g4_3', 'g4_4'],

  // 4 quadrant diagonals (one per quadrant — the other diagonal of each
  // quadrant was removed so the two long corner-to-corner grid diagonals,
  // g0_0-g2_2-g4_4 and g4_0-g2_2-g0_4, are gone and g2_2 keeps only its
  // row/column connections). The remaining 4 line up with the top/bottom
  // triangle diagonals into single long lines (see NODES comments above).
  ['g2_0', 'g1_1', 'g0_2'], // top-left /
  ['g2_0', 'g3_1', 'g4_2'], // top-right \
  ['g0_2', 'g1_3', 'g2_4'], // bottom-left \
  ['g4_2', 'g3_3', 'g2_4'], // bottom-right /

  // Top triangle (5 lines): base, both slants, centerline, crossbar
  ['tTL', 'tTC', 'tTR'],
  ['tTL', 'tML', 'g2_0'],
  ['tTR', 'tMR', 'g2_0'],
  ['tTC', 'tMC', 'g2_0'],
  ['tML', 'tMC', 'tMR'],

  // Bottom triangle (5 lines), mirrored
  ['bBL', 'bBC', 'bBR'],
  ['bBL', 'bML', 'g2_4'],
  ['bBR', 'bMR', 'g2_4'],
  ['bBC', 'bMC', 'g2_4'],
  ['bML', 'bMC', 'bMR'],
];

/** node -> set of adjacent nodes (one line-step away), derived from LINES. */
export const ADJACENCY: Record<string, string[]> = (() => {
  const adj: Record<string, Set<string>> = {};
  for (const id of Object.keys(NODES)) adj[id] = new Set();
  for (const line of LINES) {
    for (let i = 0; i < line.length - 1; i++) {
      adj[line[i]].add(line[i + 1]);
      adj[line[i + 1]].add(line[i]);
    }
  }
  const result: Record<string, string[]> = {};
  for (const id of Object.keys(adj)) result[id] = Array.from(adj[id]);
  return result;
})();

/**
 * Every consecutive triple [a, b, c] along a line, in both directions.
 * A jump-capture is: soldier at a, enemy at b, empty at c (or reversed).
 */
export const JUMP_TRIPLES: [string, string, string][] = (() => {
  const triples: [string, string, string][] = [];
  for (const line of LINES) {
    for (let i = 0; i < line.length - 2; i++) {
      triples.push([line[i], line[i + 1], line[i + 2]]);
    }
  }
  return triples;
})();

// ── Starting position ────────────────────────────────────────────────────
// Orange: top triangle (6) + grid rows 0-1 (10) = 16
export const ORANGE_START: string[] = [
  'tTL', 'tTC', 'tTR', 'tML', 'tMC', 'tMR',
  'g0_0', 'g1_0', 'g2_0', 'g3_0', 'g4_0',
  'g0_1', 'g1_1', 'g2_1', 'g3_1', 'g4_1',
];

// Black: grid rows 3-4 (10) + bottom triangle (6) = 16
export const BLACK_START: string[] = [
  'g0_3', 'g1_3', 'g2_3', 'g3_3', 'g4_3',
  'g0_4', 'g1_4', 'g2_4', 'g3_4', 'g4_4',
  'bBL', 'bBC', 'bBR', 'bML', 'bMC', 'bMR',
];

// Row 2 (g0_2..g4_2) starts empty — the contested middle zone.
export const MIDDLE_ROW: string[] = ['g0_2', 'g1_2', 'g2_2', 'g3_2', 'g4_2'];

// "Reaching the opponent's starting edge" (for the Claiming the Dead rule)
// is interpreted as reaching the opponent's outermost edge line.
export const ORANGE_TARGET_EDGE: string[] = ['bBL', 'bBC', 'bBR', 'bML', 'bMC', 'bMR', 'g0_4', 'g1_4', 'g2_4', 'g3_4', 'g4_4'];
export const BLACK_TARGET_EDGE: string[] = ['tTL', 'tTC', 'tTR', 'tML', 'tMC', 'tMR', 'g0_0', 'g1_0', 'g2_0', 'g3_0', 'g4_0'];

export const ALL_NODE_IDS: string[] = Object.keys(NODES);
